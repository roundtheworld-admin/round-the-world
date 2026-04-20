// ── Database Types ──────────────────────────────────────────

export interface Profile {
  id: string;
  name: string;
  avatar_color: string;
  city: string | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  created_by: string | null;
  invite_code: string;
  created_at: string;
}

export interface Checkin {
  id: string;
  user_id: string;
  group_id: string;
  drink_name: string;
  drink_emoji: string;
  bar_name: string | null;
  city: string | null;
  rating: number | null;
  review: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface Round {
  id: string;
  from_user_id: string;
  to_user_id: string;
  group_id: string;
  checkin_id: string | null;
  drink_name: string;
  drink_emoji: string;
  amount_cents: number;
  note: string | null;
  status: 'pending' | 'accepted' | 'declined';
  accepted_at: string | null;
  created_at: string;
}

// A pending round with the sender's profile info
export interface PendingRound extends Round {
  from_profile: Profile;
}

export interface Settlement {
  id: string;
  group_id: string;
  from_user_id: string;
  to_user_id: string;
  amount_cents: number;
  note: string | null;
  created_at: string;
}

// ── View Types ──────────────────────────────────────────────

export interface FeedItem extends Checkin {
  user_name: string;
  avatar_color: string;
  user_city: string | null;
  user_timezone: string | null;
}

export interface Balance {
  group_id: string;
  owed_to: string;    // this person is owed money
  owed_by: string;    // this person owes money
  amount_cents: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar_color: string;
  city: string | null;
  rounds_bought: number;
  rounds_received: number;
  total_spent_cents: number;
  total_checkins: number;
  avg_rating: number | null;
}

// ── Tab summary for a single user ───────────────────────────

export interface TabEntry {
  userId: string;
  name: string;
  avatar_color: string;
  amount_cents: number;  // positive = they owe you, negative = you owe them
}

// ── Drink menu ──────────────────────────────────────────────

export interface DrinkOption {
  name: string;
  emoji: string;
  amount_cents: number;
  price_label: string;
}

export const DRINK_MENU: DrinkOption[] = [
  { name: 'Pint of their best', emoji: '🍺', amount_cents: 700, price_label: '$7' },
  { name: 'Glass of wine', emoji: '🍷', amount_cents: 900, price_label: '$9' },
  { name: 'Cocktail', emoji: '🍸', amount_cents: 1200, price_label: '$12' },
  { name: 'Whiskey neat', emoji: '🥃', amount_cents: 1000, price_label: '$10' },
  { name: 'Shot of something fun', emoji: '🥂', amount_cents: 600, price_label: '$6' },
  { name: "Dealer's choice", emoji: '🎲', amount_cents: 800, price_label: '$8' },
];

// ══════════════════════════════════════════════════════════════
// PUB MODE TYPES
// ══════════════════════════════════════════════════════════════

export type BarTheme = 'snug' | 'beach' | 'speakeasy' | 'tokyo';
export type RoundThemeId = 'pint' | 'whiskey' | 'cocktail' | 'shots';
export type QuestionStatus = 'open' | 'completed';
export type ChallengeStatus = 'done' | 'skipped';
export type HotTakeVote = 'agree' | 'disagree';

export interface PubSession {
  id: string;
  user_id: string;
  group_id: string;
  pub_name: string;
  city: string;
  bar_theme: BarTheme;
  round_theme: RoundThemeId;
  menu_photo_url: string | null;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface SessionDrink {
  id: string;
  session_id: string;
  user_id: string;
  drink_name: string;
  drink_emoji: string;
  logged_at: string;
}

export interface Question {
  id: string;
  group_id: string;
  asked_by: string | null;
  question_text: string;
  status: QuestionStatus;
  completed_at: string | null;
  created_at: string;
}

// Question with answer progress (from question_status_view)
export interface QuestionWithStatus extends Question {
  asked_by_name: string | null;
  asked_by_color: string | null;
  answer_count: number;
  member_count: number;
  is_complete: boolean;
}

export interface Answer {
  id: string;
  question_id: string;
  user_id: string;
  session_id: string | null;
  answer_text: string | null;
  is_voice: boolean;
  voice_url: string | null;
  voice_duration_seconds: number | null;
  drink_count: number;
  drink_emoji: string;
  created_at: string;
}

// Answer with the answerer's profile info (for reveals)
export interface AnswerWithProfile extends Answer {
  profile: Profile;
}

export interface ChallengeAttempt {
  id: string;
  session_id: string;
  user_id: string;
  challenge_id: string;
  status: ChallengeStatus;
  comment: string | null;
  video_sent: boolean;
  created_at: string;
}

export interface TriviaAttempt {
  id: string;
  session_id: string;
  user_id: string;
  trivia_question: string;
  correct_answer: string;
  user_answer: string;
  is_correct: boolean;
  stake_level: number;
  stake_label: string;
  created_at: string;
}

export interface HotTakeVoteRecord {
  id: string;
  session_id: string;
  user_id: string;
  hot_take_id: string;
  statement: string;
  vote: HotTakeVote;
  created_at: string;
}

export interface PredictionPick {
  id: string;
  session_id: string;
  user_id: string;
  prediction_id: string;
  prompt: string;
  picked_value: string;
  created_at: string;
}

export interface SessionReview {
  id: string;
  session_id: string;
  user_id: string;
  duration_ms: number;
  drinks_count: number;
  questions_answered: number;
  questions_asked: number;
  challenges_done: number;
  rounds_bought: number;
  unanswered_count: number;
  created_at: string;
}

// Session summary from the view
export interface SessionSummary {
  id: string;
  user_id: string;
  group_id: string;
  pub_name: string;
  city: string;
  bar_theme: BarTheme;
  round_theme: RoundThemeId;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  user_name: string;
  avatar_color: string;
  drink_count: number;
  answers_given: number;
  challenges_done: number;
}

// ── Round Theme Config (client-side) ───────────────────────

export interface RoundTheme {
  id: RoundThemeId;
  name: string;
  emoji: string;
  drink: string;
  color: string;
  desc: string;
}

export const ROUND_THEMES: RoundTheme[] = [
  { id: 'pint', name: 'Pint Night', emoji: '🍺', drink: 'pints', color: '#FDCB6E', desc: 'Classic pub vibes. Trivia is about beer history and pub culture.' },
  { id: 'whiskey', name: 'Whiskey Hour', emoji: '🥃', drink: 'whiskey', color: '#E17055', desc: 'Slow sips, strong opinions. Trivia is about whiskey and spirits.' },
  { id: 'cocktail', name: 'Cocktail Hour', emoji: '🍸', drink: 'cocktails', color: '#6C5CE7', desc: 'Fancy and chaotic. Trivia is about cocktail history.' },
  { id: 'shots', name: 'Shot Roulette', emoji: '🥂', drink: 'shots', color: '#00B894', desc: 'Fast and dangerous. More challenges, less thinking.' },
];

// ── Challenge Config (client-side) ─────────────────────────

export interface ChallengeConfig {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  severity: 'easy' | 'medium' | 'hard' | 'legendary';
  videoPrompt: string | null;
}

export const CHALLENGES: ChallengeConfig[] = [
  { id: 'ch1', title: 'SHOEY', desc: 'You know the rules. Drink from your shoe.', emoji: '👟', severity: 'legendary', videoPrompt: '🎥 SHOEY TIME -- film it and send to the group!' },
  { id: 'ch2', title: 'Down It', desc: "Whatever you're drinking right now, finish it.", emoji: '⬇️', severity: 'hard', videoPrompt: '🎥 DOWN IT -- prove you finished!' },
  { id: 'ch3', title: 'Mystery Order', desc: 'Ask the bartender for their least ordered drink. You have to drink it.', emoji: '🎰', severity: 'medium', videoPrompt: '🎥 Show us what you got!' },
  { id: 'ch4', title: 'Accent Round', desc: 'Order your next drink in the worst accent you can do. Film it.', emoji: '🗣️', severity: 'easy', videoPrompt: "🎥 Let's hear that accent!" },
  { id: 'ch5', title: "Bartender's Choice", desc: "Tell the bartender it's your birthday (even if it's not) and accept whatever they give you.", emoji: '🎂', severity: 'medium', videoPrompt: '🎥 Happy birthday! Show us the free drink!' },
  { id: 'ch6', title: 'Photo Challenge', desc: 'Take a selfie with a stranger at the bar. No context.', emoji: '📸', severity: 'easy', videoPrompt: null },
];

// ── Trivia Stakes Config ───────────────────────────────────

export interface TriviaStake {
  label: string;
  emoji: string;
  level: number;
}

export const TRIVIA_STAKES: TriviaStake[] = [
  { label: 'Sip', emoji: '🍺', level: 1 },
  { label: 'Shot', emoji: '🥃', level: 2 },
  { label: 'Down it', emoji: '⬇️', level: 3 },
];

// ── Helpers ─────────────────────────────────────────────────

export function formatCents(cents: number): string {
  const abs = Math.abs(cents);
  return `$${(abs / 100).toFixed(abs % 100 === 0 ? 0 : 2)}`;
}
