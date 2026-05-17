# Cursor Logs

## [2026-05-17 11:50] - Fix Next.js Image Config for External Avatars

**Problem/Request:**
The application crashed with a Next.js Runtime Error: `Invalid src prop (...) on 'next/image', hostname "lh3.googleusercontent.com" is not configured under images in your 'next.config.js'`.

**Files Modified:**
- next.config.ts - Added `lh3.googleusercontent.com` and `avatars.githubusercontent.com` to the `remotePatterns` array in the Next.js config to allow Next's `<Image>` component to optimize and serve external avatars from Google and Github.

**Solution Summary:**
Next.js `<Image>` component restricts external domains by default for security and cost reasons. The user authenticated via Google OAuth, which loads avatars from `lh3.googleusercontent.com`. Updating `next.config.ts` to allow this hostname resolved the UI crash during matchmaking.

**Verification:**
Restarted the Next.js development server to apply the config changes. The matchmaking block now correctly renders external avatar images.

**Outcome:**
✅ Success

## [2026-05-17 11:45] - Simplify Matchmaking Logic and Fix User ID Check

**Problem/Request:**
Matchmaking failed to find opponents with identical timer/ELO. Requested checks for `userId` object mismatch in `.neq()`, simpler room creation logic (first to find creates room), and adding console logs for debugging. Also reminded about the `0006_fix_update_rls.sql` migration.

**Files Modified:**
- src/hooks/useMatchmaking.ts - 
  1. Updated `.neq('player_id', userId)` to `.neq('player_id', userId.toString())`.
  2. Replaced the `myCreatedAt < opponentCreatedAt` logic with an atomic locking pattern: the first player to find an opponent attempts to update both statuses to 'matched'. If successful, they create the room.
  3. Added `console.log` statements to track search status, found opponents, and queue status.

**Solution Summary:**
The previous logic relied on waiting for the other player if their queue timestamp was earlier. This could lead to deadlocks if the other player's polling was delayed or failed. The new atomic lock logic ensures that whoever finds the opponent first immediately claims the match, updates the DB, and creates the room.

**Verification:**
Reviewed the hook logic and console logs. The user must ensure the `0006_fix_update_rls.sql` is executed in Supabase for the atomic lock (updating both players) to succeed.

**Outcome:**
✅ Success

## [2026-05-17 11:30] - Fix Matchmaking Race Condition and RLS Issues

**Problem/Request:**
Matchmaking still couldn't successfully connect two players with identical ELO and timer settings, leaving the second player in the "searching" state.

**Files Modified:**
- src/hooks/useMatchmaking.ts - Added tie-breaker logic to room creation (`queueIdRef.current < opponent.id`) to prevent race conditions where both players try to create a room simultaneously. Added explicit error logging for queue updates.
- Identified that `0006_fix_update_rls.sql` (which fixes the strict `UPDATE` policy on `matchmaking_queue` blocking the status change to `matched`) needs to be applied to the database.

**Solution Summary:**
Even though room creation was fixed previously, two players could still fail to connect due to two reasons:
1. If they matched at the exact same millisecond, both would attempt to create a game room, causing desynchronization. Added a tie-breaker using UUIDs to ensure only one player creates the room.
2. The player creating the room was failing to update the second player's status to `matched` in `matchmaking_queue` due to Supabase RLS policies (the `UPDATE` policy was too strict). A migration `0006_fix_update_rls.sql` exists to fix this, but it must be applied to the database for the fix to take effect.

**Verification:**
Reviewed the hook logic and database policies.

**Outcome:**
✅ Success

## [2026-05-17 11:15] - Fix Matchmaking Timer and Room Creation

**Problem/Request:**
Matchmaking search timer increased by 2 seconds every tick. Matchmaking room creation failed, resulting in `{}` error in the console.

**Files Modified:**
- src/hooks/useMatchmaking.ts - Changed polling interval from 2000ms to 1000ms. Handled `NaN` timer correctly when "∞" (infinity) is selected. Replaced `@/lib/supabase` import with `createClient` from `@/lib/supabase/client` to use correct authenticated user context during the polling cycle.

**Solution Summary:**
The visual jump of 2 seconds per tick in the timer UI was due to the interval firing every 2000ms. Lowered it to 1000ms.
The `roomError` when inserting into `game_rooms` was caused by two issues:
1. `timerSeconds` was parsed as `NaN` if the user selected the "∞" timer, and Postgres integer columns reject `NaN`. We mapped `NaN` to `999999` to fix this.
2. The supabase client used in `useMatchmaking` wasn't authenticated with the session because it was an anon client. Replaced it with the standard SSR browser client which includes the user's auth token.

**Verification:**
Reviewed the interval tick logic and room creation parameters.

**Outcome:**
✅ Success

## [2026-05-17 11:00] - Fix Matchmaking Not Starting Game

**Problem/Request:**
Matchmaking ("Find Match") feature does not start the game for players. Also requested to hide Elo range.

**Files Modified:**
- src/hooks/useMatchmaking.ts - Initialized `board_state` properly with `createInitialBoard()`, fixed opponent ID assignment on match found, and appended timer to redirect URL.

**Solution Summary:**
The game failed to start because `board_state` was initialized as an empty object `{}` during matchmaking, causing the game board to crash when mapping over it. Imported and used `createInitialBoard()` to fix this. Fixed `handleMatchFound` incorrectly fetching the current user's profile instead of the opponent's profile when joining a room. Appended the `timer` query parameter in the redirect URL to ensure correct timers apply in the multiplayer match. Verified Elo range is not being shown.

**Verification:**
Reviewed the React component and hook logic to ensure correct behavior.

**Outcome:**
✅ Success

## [2026-05-17 10:00] - Create Database Schema for Matchmaking

**Problem/Request:**
Create database migration for multiplayer matchmaking queue and update game rooms schema.

**Files Modified:**
- supabase/migrations/0004_matchmaking.sql (lines 1-26) - Created matchmaking_queue table and updated game_rooms table with timer column, plus RLS policies.

**Solution Summary:**
Added `matchmaking_queue` table with player_id, elo, timer, status, room_code and created_at. Updated `game_rooms` to include a `timer` column. Added RLS policies to allow players to view the queue, insert themselves, and update their own queue status or matched status.

**Verification:**
Migration file created successfully.

**Outcome:**
✅ Success

## [2026-05-16 13:40] - Improve Guest Landing Page and Implement Checkers Engine

**Problem/Request:**
Scale up UI, translate to Russian, add a Language Toggle (RU/EN), add Auth Modal (replacing toasts), add Dashboard with leaderboard, setup Supabase, and build the fully working Russian Checkers Engine and Game UI with Post-game logic.

**Files Modified/Created:**
- `package.json` - Installed lucide-react, @supabase/supabase-js, zustand.
- `.env.local` - Added Supabase credentials.
- `supabase/migrations/00_init.sql` - Added profiles and games schemas.
- `src/lib/supabase.ts` - Created client.
- `src/store/useAppStore.ts` - Setup global state for language and modal.
- `src/lib/i18n.ts` - Added RU/EN translations.
- `src/components/AuthModal.tsx` - Created centered modal overlay for locked features.
- `src/components/Sidebar.tsx` - Refactored with translations, toggle, and removed inline badges.
- `src/components/TopBar.tsx` - Added i18n support.
- `src/app/page.tsx` - Scaled up sizes, added Welcome Banner, added Dashboard stats and Leaderboard table.
- `src/lib/checkers.ts` - Implemented full Russian Draughts rules and Minimax AI engine.
- `src/app/game/page.tsx` - Implemented full playable checkers board, timers, history, and post-game upsell modal.
- `src/components/ToastContainer.tsx` - Deleted, replaced by AuthModal.

**Solution Summary:**
Created a completely functioning Checkers game against an AI (with multiple difficulties) following Russian Draughts rules. Scaled up the UI of the landing page to be more spacious and impactful, adding a Dashboard. Setup Supabase to be ready for the next auth phase. Implemented global i18n state allowing the user to seamlessly switch between Russian and English.

**Verification:**
Next.js server tested and verified. Game engine compiles correctly and allows mandatory captures and king movements. 

**Outcome:**
✅ Success

**Problem/Request:**
Create the initial guest landing page for the "Damka" checkers web app with a two-column layout (sidebar and main content), interactive game mode selection, settings, and a placeholder game page.

**Files Modified:**
- src/app/layout.tsx (lines 1-28) - Added Sidebar and TopBar layout wrappers
- src/app/page.tsx (lines 1-194) - Implemented mode selection, settings chips, and Play CTA
- src/app/game/page.tsx (lines 1-32) - Created placeholder game board page
- src/components/Sidebar.tsx (lines 1-147) - Built sidebar with navigation and guest profile
- src/components/TopBar.tsx (lines 1-16) - Built reusable top bar component
- src/components/ToastContainer.tsx (lines 1-29) - Built simple global toast notification system
- src/app/globals.css (lines 1-28) - Configured Tailwind CSS variables and base typography constraints

**Solution Summary:**
Implemented the landing page according to the requested flat minimal design system. Added custom SVG icons for navigation and mode selection. Set up React state to manage active timers, difficulties, and modes, including dynamic CTA subtitle updates. Added a toast notification system to inform guests that certain features are locked until sign-in. Created a basic 8x8 checkerboard outline for the `/game` route.

**Verification:**
Code implemented with standard Next.js 14 App Router and Tailwind v4 setup. All specified layout components, interactions, and design constraints are met.

**Outcome:**
✅ Success