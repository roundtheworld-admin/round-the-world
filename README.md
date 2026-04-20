# Round The World

A mobile-first web app for 4 friends in different time zones to stay connected through an async pub experience. The core feature is "Pub Mode" -- an interactive card-deck session you do solo at a bar, with questions, reveals, trivia, challenges, and hot takes that tie into your crew's shared history.

## What It Does

### Pub Mode (the main feature)
When you're at a bar, open Pub Mode and start a session. You pick a bar theme (Snug, Beach Bar, Speakeasy, Tokyo Alley), enter the pub name and city, and optionally snap the menu. Then you get a scrollable card deck that includes:

- **Reveals** -- questions everyone has answered get revealed with all answers shown at once
- **Questions** -- new questions to answer (answers stay locked until everyone weighs in)
- **Trivia with stakes** -- pick a stake (sip, shot, or down it), guess the answer, drink if you're wrong
- **Challenges** -- things like SHOEY, Down It, Mystery Order (mark done or skip, the crew sees)
- **Hot Takes** -- agree/disagree polls that show the crew split
- **Group Predictions** -- "who's most likely to..." picks
- **Ask a Question** -- submit your own questions for the next round

The card order interleaves reveals and questions, with trivia/challenges/hot takes sprinkled between every 2 cards.

### The Bar Feed
Check in when you're at a pub. Share what you're drinking, rate it, write a quick review. Your crew sees it in real time.

### Buy a Round
See a friend checked in somewhere? Tap "Buy a round" to send them a drink. Pick from the menu, add a note, and they get notified. Rounds are tracked on a running tab.

### Tab
Running balance of who owes who. Buy rounds, settle up, see the full history.

### Crew Page
Group stats, leaderboard (most generous, biggest spender, most check-ins, best taste), and where everyone is with live timezone clocks. Invite code for adding friends.

## Tech Stack

- **Next.js 14** (App Router) -- React framework
- **Supabase** -- Auth (magic link), Postgres database, real-time subscriptions, storage
- **Tailwind CSS** -- Styling
- **Lucide React** -- Icons
- **Vercel** -- Deployment

## Live URL

https://roundtheworld-app1.vercel.app

## Getting Started

### 1. Supabase Setup

The project uses a Supabase instance at `https://qdtktdgpyvgfycgpdvnw.supabase.co`. The full schema is in `supabase/schema.sql` and includes:

- Core tables: profiles, groups, group_members, checkins, rounds, settlements
- Pub Mode tables: pub_sessions, session_drinks, questions, answers, challenge_attempts, trivia_attempts, hot_take_votes, prediction_picks, session_reviews
- Views: feed_view, balance_view, leaderboard_view, question_status_view, session_summary_view
- Auto-completion trigger: when all group members answer a question, it's automatically marked as completed
- Real-time enabled on: answers, questions, session_drinks
- Row-level security on all tables

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL` -- your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` -- your Supabase publishable/anon key
- `NEXT_PUBLIC_APP_URL` -- your deployment URL (or http://localhost:3000 for local dev)

### 3. Install and Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. Use Chrome DevTools mobile view for the best experience.

### 4. First Time Setup

1. Sign in with your email (magic link -- check your inbox)
2. Set your name and city
3. Create a crew -- you get an invite code
4. Share the invite code with your friends

## Deploy to Vercel

```bash
npm i -g vercel
vercel --prod --force
```

Add environment variables in the Vercel dashboard (Settings > Environment Variables) and add your Vercel callback URL (`https://your-app.vercel.app/auth/callback`) to Supabase's auth redirect URLs.

The `--force` flag skips build cache, which is important if you've had previous failed builds.

## Project Structure

```
src/
  app/
    page.tsx              -- Main app (auth, onboarding, all tabs)
    layout.tsx            -- Root layout with PWA meta tags
    globals.css           -- Tailwind + custom styles
    auth/callback/        -- Magic link redirect handler (PKCE flow)
  components/
    Avatar.tsx            -- User avatar with initials
    BottomNav.tsx         -- Tab bar (Feed, Pub Mode, Tab, Crew, Profile)
    BuyRoundSheet.tsx     -- Bottom sheet for buying a round
    CheckinSheet.tsx      -- Bottom sheet for posting a check-in
    FeedCard.tsx          -- Individual feed item card
    PendingRounds.tsx     -- Incoming round notifications
    SettleUpSheet.tsx     -- Bottom sheet for settling a tab
    StarRating.tsx        -- Interactive star rating
    pub/
      PixelBar.tsx        -- Pixel art bar scene SVGs (4 themes)
      BeerSprite.tsx      -- Pixel art beer pint + animated version
      AnswerProgress.tsx  -- Circular progress ring for answer counts
      PubModeEntry.tsx    -- 3-step entry: theme, pub details, menu photo
      PubSession.tsx      -- Full card deck experience
  hooks/
    useAuth.ts            -- Auth + profile management
    useFeed.ts            -- Feed data + real-time updates
    useGroup.ts           -- Group/crew management + leaderboard
    useTab.ts             -- Tab/balance management
    usePubSession.ts      -- Pub session lifecycle (start, log drinks, end)
    useQuestions.ts       -- Async Q&A engine with real-time subscriptions
  lib/
    supabase-browser.ts   -- Supabase client (browser)
    supabase-server.ts    -- Supabase client (server, for auth callback)
    types.ts              -- All TypeScript types + config constants
    time.ts               -- Timezone helpers
    whatsapp.ts           -- WhatsApp share helpers
supabase/
  schema.sql              -- Complete database schema (584 lines)
public/
  manifest.json           -- PWA manifest for home screen install
```

## Key Design Decisions

- **Async-first**: Questions are answered solo during pub sessions. Answers only reveal once everyone has responded. This makes it work across time zones without needing everyone online at once.
- **Card deck UX**: The session is a linear scroll of cards rather than separate pages. This keeps momentum and makes it feel like a conversation.
- **Interleaving algorithm**: Reveals and questions alternate, with trivia/challenges/hot takes dropped in every 2 cards. This keeps sessions varied and unpredictable.
- **DB trigger for completion**: A Postgres trigger fires after each answer insert and checks if all members have answered. If so, the question is automatically marked completed. No polling needed.
- **Magic link auth**: No passwords. Just email, click, done. Works well for a small friend group.
- **PWA**: Add to home screen for an app-like experience on mobile. No app store needed.
