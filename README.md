# SkillBridge 🔄

Peer-to-peer skill exchange platform — learn what you want by teaching what you know.

## Features
- **Matching engine** (`server/services/matchingEngine.js`): bidirectional teach ↔ learn matching with a weighted score (mutual bonus, skill overlap, rating, completed sessions, availability overlap, level fit) plus 3-way **skill chains** when no direct match exists. Pure functions, unit tested.
- **Real-time chat** with Socket.IO: JWT-authenticated sockets, typing indicators, online presence.
- **Profiles** with skills + levels and recurring weekly availability slots.
- **Search** for teachers, ranked by rating and completed sessions.
- **Ratings & reviews**, session logging.
- **Session booking with conflict detection** (`server/services/booking.js`): propose → accept/decline → complete. Overlapping sessions are rejected for either user, and re-checked on accept. Accepted sessions get an auto-generated Jitsi video-call link. Completing a session updates both users' stats.
- **Quick-add skill chips** on the profile page.
- **Dark theme** (default) with a light/dark toggle saved in localStorage.

## Stack
MongoDB · Express · React (Vite) · Node.js · Socket.IO · JWT

## Run locally
```bash
# 1. backend
cd server && npm install && cp .env.example .env
npm run seed      # demo users (password: password123)
npm run dev       # http://localhost:5000

# 2. frontend (new terminal)
cd client && npm install && npm run dev   # http://localhost:5173
```
Log in as **demo@demo.com / password123** — you'll match with Priya (guitar ↔ react) and see a 3-way chain example.

Tests: `cd server && npm test`

## Docker
`docker-compose up --build` → app on http://localhost:5173, API on :5000. Seed with `docker-compose exec backend node seed.js`.

## API
| Method | Route | Description |
|---|---|---|
| POST | /api/auth/register, /login | Auth, returns JWT |
| GET | /api/auth/me | Current user |
| PUT | /api/users/me | Update profile/skills/availability |
| GET | /api/users/matches | Ranked matches + skill chains |
| GET | /api/users/search?q= | Search teachers |
| GET | /api/users/:id | Public profile + reviews |
| POST | /api/users/:id/rate | Rate a user (1–5) |
| POST | /api/users/:id/complete-session | Log a completed session |
| GET | /api/messages, /api/messages/:partnerId | Conversations / history |

Socket events: `message:send`, `message:new`, `typing`, `presence`.

## Matching score
`mutual bonus 40 + skill overlap (≤30) + rating×4 (≤20) + sessions (≤10) + availability hours×3 (≤15) + level fit`. Mutual matches always rank above one-way matches.
