# HomeQuest PRD v1.0

## Vision
Every Good Habit Is an Adventure. Help a 4–5-year-old develop independence, discipline, love of learning, problem solving, and financial literacy through age-appropriate quests and feedback.

## Users
- Child: browse quests, submit completion, see XP/coins/levels/badges, request rewards.
- Parent: create/manage quests, approve/retry submissions, manage rewards, review history.

## Domains
Home Hero (domestic jobs); Brain Master (mathematics); Book Explorer (reading); Faith Journey (Qur'an memorization/revision); Language Explorer (English).

## Core loop
Parent creates quest → child submits completion → parent verifies → award XP and coins once → progress/achievement updates → child saves coins and requests a reward.

## Economy
XP advances levels and is never deducted. Coins are used for rewards. Routine responsibilities need not all earn spendable coins; parents can use XP-only quests for ordinary habits and coins for selected optional/challenge quests.

## Suggested progression
Beginner 0 XP; Explorer 100; Adventurer 250; Champion 450; Master 700; Legend 1000.

## MVP scope
Responsive child/parent views, quest CRUD, submission and approval, XP/coins, levels, achievement, reward catalogue, redemption demonstration, and history.

## Acceptance criteria
1. Child can submit a quest on a tablet.
2. Parent can review it on another device (requires cloud integration; not yet in this static demo).
3. An approved submission can award points only once (must be enforced transactionally in production).
4. Rejection awards no points and never deducts earned XP.
5. Every point movement is auditable.
6. Cloud state synchronizes across devices.

## Architecture
GitHub Pages hosts the static frontend. Supabase Auth/PostgreSQL/RLS and secure RPCs will provide cloud identity, persistence, and idempotent approval in the next integration phase. Current deployed prototype uses localStorage only.

## Non-goals for MVP
Multiplayer, leaderboard, AI-generated quests, adaptive difficulty, and push notifications.
