-- ============================================================
-- Round The World - Database Schema
-- Run this in your Supabase SQL Editor to set up all tables
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ── Users (extends Supabase auth.users) ─────────────────────
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  avatar_color text not null default '#6C5CE7',
  city text,
  timezone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Groups ──────────────────────────────────────────────────
create table public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_by uuid references public.profiles(id) on delete set null,
  invite_code text unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz default now()
);

create table public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- ── Check-ins (the beer feed) ───────────────────────────────
create table public.checkins (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade not null,
  drink_name text not null,
  drink_emoji text default '🍺',
  bar_name text,
  city text,
  rating numeric(2,1) check (rating >= 0 and rating <= 5),
  review text,
  photo_url text,
  created_at timestamptz default now()
);

-- ── Rounds / Tab Ledger ─────────────────────────────────────
-- Async flow:
--   1. from_user OFFERS a round (status = 'pending')
--   2. to_user ACCEPTS it (status = 'accepted') -- now it hits the tab
--   3. to_user can also decline (status = 'declined')
-- The tab only counts accepted rounds.
-- from_user = the buyer. to_user = the recipient who owes from_user.
create table public.rounds (
  id uuid default uuid_generate_v4() primary key,
  from_user_id uuid references public.profiles(id) on delete cascade not null,
  to_user_id uuid references public.profiles(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade not null,
  checkin_id uuid references public.checkins(id) on delete set null,
  drink_name text not null,
  drink_emoji text default '🍺',
  amount_cents integer not null default 0,
  note text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  accepted_at timestamptz,
  created_at timestamptz default now()
);

-- ── Settlements ─────────────────────────────────────────────
-- When two people settle up, record it here. This zeroes out
-- (or partially reduces) the balance between them.
create table public.settlements (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  from_user_id uuid references public.profiles(id) on delete cascade not null,
  to_user_id uuid references public.profiles(id) on delete cascade not null,
  amount_cents integer not null,
  note text,
  created_at timestamptz default now()
);

-- ── Row Level Security ──────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.checkins enable row level security;
alter table public.rounds enable row level security;
alter table public.settlements enable row level security;

-- Profiles: anyone can read, users can update their own
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Groups: creator or members can read
create policy "Group members can view groups"
  on public.groups for select using (
    auth.uid() = created_by
    or
    exists (select 1 from public.group_members where group_id = id and user_id = auth.uid())
  );
create policy "Authenticated users can create groups"
  on public.groups for insert with check (auth.uid() = created_by);

-- Allow a non-member to look up a group by invite code and join it in one
-- atomic step. This is SECURITY DEFINER because the RLS "members only"
-- SELECT policy above would otherwise block the lookup (chicken-and-egg:
-- you can't see the group until you join, and you can't join until you see it).
create or replace function public.join_group_by_invite_code(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_group_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select id into target_group_id
  from public.groups
  where lower(invite_code) = lower(trim(code));

  if target_group_id is null then
    raise exception 'Group not found' using errcode = 'P0002';
  end if;

  insert into public.group_members (group_id, user_id)
  values (target_group_id, auth.uid())
  on conflict do nothing;

  return target_group_id;
end;
$$;

grant execute on function public.join_group_by_invite_code(text) to authenticated;

-- Let the crew creator rename the crew. Scoped via SECURITY DEFINER so only
-- the `name` column is ever touched; invite_code, created_by, etc. cannot
-- be changed by this function.
create or replace function public.rename_group(group_id uuid, new_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if length(trim(new_name)) = 0 then
    raise exception 'Name cannot be empty' using errcode = '22023';
  end if;

  update public.groups
  set name = trim(new_name)
  where id = group_id
    and created_by = auth.uid();

  if not found then
    raise exception 'Only the crew creator can rename it' using errcode = '42501';
  end if;
end;
$$;

grant execute on function public.rename_group(uuid, text) to authenticated;

-- Group members (readable by any authenticated user -- group-level
-- security is enforced on the groups table itself)
create policy "Members can view group members"
  on public.group_members for select using (true);
create policy "Users can join groups"
  on public.group_members for insert with check (auth.uid() = user_id);

-- Check-ins: visible to group members
create policy "Group members can view checkins"
  on public.checkins for select using (
    exists (select 1 from public.group_members where group_id = checkins.group_id and user_id = auth.uid())
  );
create policy "Users can create checkins"
  on public.checkins for insert with check (auth.uid() = user_id);

-- Rounds: visible to group members
create policy "Group members can view rounds"
  on public.rounds for select using (
    exists (select 1 from public.group_members where group_id = rounds.group_id and user_id = auth.uid())
  );
create policy "Users can send rounds"
  on public.rounds for insert with check (auth.uid() = from_user_id);
create policy "Recipients can accept or decline rounds"
  on public.rounds for update using (auth.uid() = to_user_id);

-- Settlements: visible to group members
create policy "Group members can view settlements"
  on public.settlements for select using (
    exists (select 1 from public.group_members where group_id = settlements.group_id and user_id = auth.uid())
  );
create policy "Users can create settlements"
  on public.settlements for insert with check (
    auth.uid() = from_user_id or auth.uid() = to_user_id
  );

-- ── Views ───────────────────────────────────────────────────

-- Feed view: checkins with user info
create or replace view public.feed_view as
select
  c.*,
  p.name as user_name,
  p.avatar_color,
  p.city as user_city,
  p.timezone as user_timezone
from public.checkins c
join public.profiles p on p.id = c.user_id
order by c.created_at desc;

-- Balance view: net balance between every pair of users in a group.
-- Positive amount = user_a is owed by user_b (user_b owes user_a).
-- Combines rounds and settlements into one net figure.
create or replace view public.balances_view as
with round_debts as (
  -- Each round: to_user owes from_user the amount (only accepted rounds count)
  select
    group_id,
    from_user_id as creditor,
    to_user_id as debtor,
    sum(amount_cents) as total_cents
  from public.rounds
  where status = 'accepted'
  group by group_id, from_user_id, to_user_id
),
settlement_credits as (
  -- Each settlement: from_user paid to_user (reduces what from_user owes to_user)
  select
    group_id,
    to_user_id as creditor,
    from_user_id as debtor,
    sum(amount_cents) as total_cents
  from public.settlements
  group by group_id, to_user_id, from_user_id
),
all_debts as (
  select * from round_debts
  union all
  -- Settlements reduce debt, so we subtract them (negative direction)
  select group_id, debtor as creditor, creditor as debtor, total_cents
  from settlement_credits
),
net as (
  select
    group_id,
    creditor,
    debtor,
    sum(total_cents) as net_cents
  from all_debts
  group by group_id, creditor, debtor
)
-- Only show pairs where there is a non-zero balance, normalized so net is positive
select
  group_id,
  case when net_cents > 0 then creditor else debtor end as owed_to,
  case when net_cents > 0 then debtor else creditor end as owed_by,
  abs(net_cents) as amount_cents
from net
where net_cents != 0
  and creditor < debtor;  -- deduplicate pairs

-- Leaderboard view
create or replace view public.leaderboard_view as
select
  p.id,
  p.name,
  p.avatar_color,
  p.city,
  (select count(*) from public.rounds r where r.from_user_id = p.id and r.status = 'accepted') as rounds_bought,
  (select count(*) from public.rounds r where r.to_user_id = p.id and r.status = 'accepted') as rounds_received,
  (select coalesce(sum(r.amount_cents), 0) from public.rounds r where r.from_user_id = p.id and r.status = 'accepted') as total_spent_cents,
  (select count(*) from public.checkins c where c.user_id = p.id) as total_checkins,
  (select avg(c.rating) from public.checkins c where c.user_id = p.id) as avg_rating
from public.profiles p;

-- ══════════════════════════════════════════════════════════════
-- PUB MODE TABLES
-- ══════════════════════════════════════════════════════════════

-- ── Pub Sessions ───────────────────────────────────────────
-- A session is one visit to a pub. Records where, when, and what theme.
create table public.pub_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade not null,
  pub_name text not null,
  city text not null,
  bar_theme text not null default 'snug' check (bar_theme in ('snug', 'beach', 'speakeasy', 'tokyo')),
  round_theme text not null default 'pint' check (round_theme in ('pint', 'whiskey', 'cocktail', 'shots')),
  menu_photo_url text,
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_ms bigint,
  created_at timestamptz default now()
);

-- ── Session Drinks ─────────────────────────────────────────
-- Drinks logged during a specific pub session (the drink counter).
create table public.session_drinks (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.pub_sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  drink_name text not null,
  drink_emoji text not null default '🍺',
  logged_at timestamptz default now()
);

-- ── Questions ──────────────────────────────────────────────
-- Questions live at the GROUP level, not session level.
-- They persist across sessions since answers are async.
-- status: 'open' (still accepting answers), 'completed' (all members answered)
create table public.questions (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  asked_by uuid references public.profiles(id) on delete set null,
  question_text text not null,
  status text not null default 'open' check (status in ('open', 'completed')),
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- ── Answers ────────────────────────────────────────────────
-- One answer per user per question. Can be text or voice note.
-- The async reveal mechanic: answers are hidden until the question
-- status flips to 'completed' (all group members have answered).
create table public.answers (
  id uuid default uuid_generate_v4() primary key,
  question_id uuid references public.questions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  session_id uuid references public.pub_sessions(id) on delete set null,
  answer_text text,
  is_voice boolean not null default false,
  voice_url text,
  voice_duration_seconds integer,
  drink_count integer default 0,
  drink_emoji text default '🍺',
  created_at timestamptz default now(),
  unique(question_id, user_id)
);

-- ── Challenge Attempts ─────────────────────────────────────
-- Tracks who did/skipped a challenge in a session.
create table public.challenge_attempts (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.pub_sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  challenge_id text not null,
  status text not null check (status in ('done', 'skipped')),
  comment text,
  video_sent boolean default false,
  created_at timestamptz default now(),
  unique(session_id, user_id, challenge_id)
);

-- ── Trivia Attempts ────────────────────────────────────────
-- Records trivia answers and what stake the user picked.
create table public.trivia_attempts (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.pub_sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  trivia_question text not null,
  correct_answer text not null,
  user_answer text not null,
  is_correct boolean not null,
  stake_level integer not null default 1 check (stake_level between 1 and 3),
  stake_label text not null default 'Sip',
  created_at timestamptz default now()
);

-- ── Hot Take Votes ─────────────────────────────────────────
create table public.hot_take_votes (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.pub_sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  hot_take_id text not null,
  statement text not null,
  vote text not null check (vote in ('agree', 'disagree')),
  created_at timestamptz default now(),
  unique(session_id, user_id, hot_take_id)
);

-- ── Prediction Picks ───────────────────────────────────────
create table public.prediction_picks (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.pub_sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  prediction_id text not null,
  prompt text not null,
  picked_value text not null,
  created_at timestamptz default now(),
  unique(session_id, user_id, prediction_id)
);

-- ── Session Reviews ────────────────────────────────────────
-- Saved when a user hits "quit" -- captures the session summary.
create table public.session_reviews (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.pub_sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  duration_ms bigint not null,
  drinks_count integer not null default 0,
  questions_answered integer not null default 0,
  questions_asked integer not null default 0,
  challenges_done integer not null default 0,
  rounds_bought integer not null default 0,
  unanswered_count integer not null default 0,
  created_at timestamptz default now(),
  unique(session_id, user_id)
);

-- ── Pub Mode RLS Policies ──────────────────────────────────

alter table public.pub_sessions enable row level security;
alter table public.session_drinks enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.challenge_attempts enable row level security;
alter table public.trivia_attempts enable row level security;
alter table public.hot_take_votes enable row level security;
alter table public.prediction_picks enable row level security;
alter table public.session_reviews enable row level security;

-- Pub sessions: group members can view, users can create/update their own
create policy "Group members can view pub sessions"
  on public.pub_sessions for select using (
    exists (select 1 from public.group_members where group_id = pub_sessions.group_id and user_id = auth.uid())
  );
create policy "Users can create own pub sessions"
  on public.pub_sessions for insert with check (auth.uid() = user_id);
create policy "Users can update own pub sessions"
  on public.pub_sessions for update using (auth.uid() = user_id);

-- Session drinks: group members can view, users can insert their own
create policy "Group members can view session drinks"
  on public.session_drinks for select using (
    exists (
      select 1 from public.pub_sessions ps
      join public.group_members gm on gm.group_id = ps.group_id
      where ps.id = session_drinks.session_id and gm.user_id = auth.uid()
    )
  );
create policy "Users can log own session drinks"
  on public.session_drinks for insert with check (auth.uid() = user_id);

-- Questions: group members can view and create
create policy "Group members can view questions"
  on public.questions for select using (
    exists (select 1 from public.group_members where group_id = questions.group_id and user_id = auth.uid())
  );
create policy "Group members can create questions"
  on public.questions for insert with check (
    exists (select 1 from public.group_members where group_id = questions.group_id and user_id = auth.uid())
  );
create policy "System can update question status"
  on public.questions for update using (
    exists (select 1 from public.group_members where group_id = questions.group_id and user_id = auth.uid())
  );

-- Answers: group members can view (but app enforces reveal logic),
-- users can insert their own
create policy "Group members can view answers"
  on public.answers for select using (
    exists (
      select 1 from public.questions q
      join public.group_members gm on gm.group_id = q.group_id
      where q.id = answers.question_id and gm.user_id = auth.uid()
    )
  );
create policy "Users can submit own answers"
  on public.answers for insert with check (auth.uid() = user_id);

-- Challenge attempts: group members can view, users can insert own
create policy "Group members can view challenge attempts"
  on public.challenge_attempts for select using (
    exists (
      select 1 from public.pub_sessions ps
      join public.group_members gm on gm.group_id = ps.group_id
      where ps.id = challenge_attempts.session_id and gm.user_id = auth.uid()
    )
  );
create policy "Users can insert own challenge attempts"
  on public.challenge_attempts for insert with check (auth.uid() = user_id);

-- Trivia attempts: group members can view, users can insert own
create policy "Group members can view trivia attempts"
  on public.trivia_attempts for select using (
    exists (
      select 1 from public.pub_sessions ps
      join public.group_members gm on gm.group_id = ps.group_id
      where ps.id = trivia_attempts.session_id and gm.user_id = auth.uid()
    )
  );
create policy "Users can insert own trivia attempts"
  on public.trivia_attempts for insert with check (auth.uid() = user_id);

-- Hot take votes: group members can view, users can insert own
create policy "Group members can view hot take votes"
  on public.hot_take_votes for select using (
    exists (
      select 1 from public.pub_sessions ps
      join public.group_members gm on gm.group_id = ps.group_id
      where ps.id = hot_take_votes.session_id and gm.user_id = auth.uid()
    )
  );
create policy "Users can insert own hot take votes"
  on public.hot_take_votes for insert with check (auth.uid() = user_id);

-- Prediction picks: group members can view, users can insert own
create policy "Group members can view prediction picks"
  on public.prediction_picks for select using (
    exists (
      select 1 from public.pub_sessions ps
      join public.group_members gm on gm.group_id = ps.group_id
      where ps.id = prediction_picks.session_id and gm.user_id = auth.uid()
    )
  );
create policy "Users can insert own prediction picks"
  on public.prediction_picks for insert with check (auth.uid() = user_id);

-- Session reviews: group members can view, users can insert own
create policy "Group members can view session reviews"
  on public.session_reviews for select using (
    exists (
      select 1 from public.pub_sessions ps
      join public.group_members gm on gm.group_id = ps.group_id
      where ps.id = session_reviews.session_id and gm.user_id = auth.uid()
    )
  );
create policy "Users can insert own session reviews"
  on public.session_reviews for insert with check (auth.uid() = user_id);

-- ── Pub Mode Views ─────────────────────────────────────────

-- Question status view: shows each question with answer count
-- and whether it's ready for reveal
create or replace view public.question_status_view as
select
  q.id,
  q.group_id,
  q.asked_by,
  q.question_text,
  q.status,
  q.created_at,
  p.name as asked_by_name,
  p.avatar_color as asked_by_color,
  (select count(*) from public.answers a where a.question_id = q.id) as answer_count,
  (select count(*) from public.group_members gm where gm.group_id = q.group_id) as member_count,
  (select count(*) from public.answers a where a.question_id = q.id)
    = (select count(*) from public.group_members gm where gm.group_id = q.group_id) as is_complete
from public.questions q
left join public.profiles p on p.id = q.asked_by
order by q.created_at desc;

-- Auto-complete questions when all members have answered
create or replace function public.check_question_completion()
returns trigger as $$
declare
  member_count integer;
  answer_count integer;
begin
  -- Count group members for this question's group
  select count(*) into member_count
  from public.group_members gm
  join public.questions q on q.group_id = gm.group_id
  where q.id = new.question_id;

  -- Count answers for this question
  select count(*) into answer_count
  from public.answers
  where question_id = new.question_id;

  -- If all members answered, mark question as completed
  if answer_count >= member_count then
    update public.questions
    set status = 'completed', completed_at = now()
    where id = new.question_id and status = 'open';
  end if;

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_answer_inserted
  after insert on public.answers
  for each row execute procedure public.check_question_completion();

-- Session summary view: aggregates session stats
create or replace view public.session_summary_view as
select
  ps.id,
  ps.user_id,
  ps.group_id,
  ps.pub_name,
  ps.city,
  ps.bar_theme,
  ps.round_theme,
  ps.started_at,
  ps.ended_at,
  ps.duration_ms,
  p.name as user_name,
  p.avatar_color,
  (select count(*) from public.session_drinks sd where sd.session_id = ps.id) as drink_count,
  (select count(*) from public.answers a where a.session_id = ps.id) as answers_given,
  (select count(*) from public.challenge_attempts ca where ca.session_id = ps.id and ca.status = 'done') as challenges_done
from public.pub_sessions ps
join public.profiles p on p.id = ps.user_id
order by ps.started_at desc;

-- ── Supabase Realtime ──────────────────────────────────────
-- Enable realtime on key tables so the app can listen for
-- new answers (to update reveal progress) and new questions.

alter publication supabase_realtime add table public.answers;
alter publication supabase_realtime add table public.questions;
alter publication supabase_realtime add table public.session_drinks;

-- ── Auto-create profile on signup ───────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    (array['#6C5CE7', '#E17055', '#00B894', '#FDCB6E', '#0984E3', '#D63031', '#00CEC9', '#E84393'])[floor(random() * 8 + 1)]
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
