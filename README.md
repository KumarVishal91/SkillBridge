# SkillBridge 🔄

Peer-to-peer skill exchange platform — learn what you want by teaching what you know.

SkillBridge connects people who want to trade skills instead of paying for courses. It finds mutual "teach X / learn Y" matches, gets people talking, and helps them book and run sessions — no money changes hands.

## 🚀 Why SkillBridge

Most "learn a skill" platforms are one-directional: you pay, someone teaches. SkillBridge flips that into a two-sided marketplace of knowledge — the currency is your own expertise. The hardest engineering problem here isn't the CRUD, it's the matching layer: reliably pairing complementary "teach X / learn Y" intents with fairness and availability baked in.

## ✨ Core Features

| Feature | Description |
|---|---|
| 🧠 Skill Matching Engine | Matches users bidirectionally (teach ↔ learn) and ranks matches by rating, availability overlap, and skill level |
| 👤 User Profiles | Skills taught, skills wanted, bio, availability |
| 💬 Real-Time Chat | Socket.IO-powered messaging with typing indicators & presence |
| ⭐ Ratings | Session completion and rating tracked per user |
| 🔍 Search | Full-text search across who teaches what skill |
| 🔗 Skill Chains (stretch) | Suggests 3-way skill chains (A→B→C→A) when no direct match exists |

## 🛠️ Tech Stack

**Core:** MongoDB · Express.js · React · Node.js (MERN)
**Real-time:** Socket.IO
**Auth:** JWT
**Frontend tooling:** Vite, React Router, Axios

## 🧩 What Makes This Different

1. **Matching engine as a first-class service** — not a simple `find()` query. Models users as a bidirectional graph of `teaches[]` / `wants[]` edges, computes a weighted score (mutual-match bonus, rating, completed sessions, availability overlap), and falls back to suggesting 3-way skill chains when no direct match exists.
2. **Real availability modeling** — recurring day/time slots with overlap detection, not a free-text field.
3. **Reputation-aware search** — results factor in rating and completed sessions, not just recency.

## 🏗️ System Architecture

```
┌─────────────┐      REST + WS      ┌──────────────┐
│   React     │ ◄─────────────────► │   Express    │
│  Frontend   │                     │   Backend    │
└─────────────┘                     └──────┬───────┘
                                            │
                     ┌──────────────────────┼──────────────────────┐
                     │                      │                      │
              ┌──────▼──────┐      ┌────────▼────────┐    ┌────────▼────────┐
              │   MongoDB   │      │    Socket.IO     │    │  Matching       │
              │  (Users,    │      │  (Chat, Presence)│    │  Engine         │
              │  Messages)  │      └──────────────────┘    │  (Service)      │
              └─────────────┘                              └─────────────────┘
```

## 📁 Project Structure

```
SkillBridge/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/             # Auth, Socket contexts
│   │   └── services/            # API calls
│   └── package.json
├── server/                     # Express backend
│   ├── controllers/
│   ├── models/                  # User, Message
│   ├── routes/
│   ├── services/
│   │   └── matchingEngine.js    # Core matching algorithm
│   ├── middleware/
│   ├── sockets/                 # Socket.IO chat handler
│   └── server.js
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)

### Clone the Repo

```bash
git clone https://github.com/<your-username>/SkillBridge.git
cd SkillBridge
```

### Backend Setup

```bash
cd server
npm install
cp .env.example .env   # then fill in your values
npm run dev
```

Backend runs at `http://localhost:5000`.

### Frontend Setup

```bash
cd client
npm install
cp .env.example .env   # then fill in your values
npm run dev
```

Frontend runs at `http://localhost:5173`.

### Run with Docker

From the project root:

```bash
docker-compose up --build
```

This builds and runs both the backend (port 5000) and frontend (port 5173) containers.

To tear down:

```bash
docker-compose down --rmi all
```

## 🗺️ Roadmap

- [x] Core auth (JWT)
- [x] User profiles & skill tagging
- [x] Matching engine v1 (mutual matches + weighted scoring)
- [x] Real-time chat (Socket.IO)
- [x] Docker setup
- [ ] Availability & booking system with conflict detection
- [ ] Ratings & reviews submission flow
- [ ] Email notifications
- [ ] Video sessions (SDK-based)
- [ ] Matching engine v2 (skill-chain UI)

## 📄 License

MIT License — free to use, modify, and learn from.

## 🙋 Author

Built by **Vishal Kumar** as a portfolio project to demonstrate full-stack MERN engineering, with a focus on non-trivial backend logic (matching algorithms, real-time infrastructure).
