# JARVIS

**Open-source desktop AI assistant with a floating Dynamic Island-inspired UI**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: In Development](https://img.shields.io/badge/Status-In%20Development-orange.svg)]()
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows%2010%2F11-lightgrey.svg)]()
[![Java 21+](https://img.shields.io/badge/Java-21%2B-red.svg)]()
[![Built with Tauri](https://img.shields.io/badge/Built%20with-Tauri-24C8D8.svg)](https://tauri.app)

[Features](#features) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started) · [Roadmap](#roadmap) · [Contributing](#contributing)

</div>

---

## What is JARVIS?

JARVIS is a **desktop-first AI assistant** that lives as a small floating pill on your screen — inspired by the Dynamic Island interaction pattern, adapted for desktop workflows.

Click it, and it expands into a conversational panel. Ask it to summarize your Gmail, classify important messages, or draft a reply. When you're done, it collapses back out of the way.

Everything runs **locally on your machine**. You connect your own Google account, use your own AI provider key, and stay in full control of your data.

> **Current focus:** Gmail — summarize, classify, and draft replies.
> Calendar, Drive, and scheduled briefings are next.

---

## Features

### ✅ Available in MVP
- 🪟 **Floating pill UI** — compact, draggable, always-on-top (configurable), expands on click
- 📬 **Gmail integration** — search, read, and classify recent messages via Google OAuth
- 🧠 **AI-powered summaries** — category, priority, action required, and extracted dates per email
- ✍️ **Reply drafting** — generate and save drafts to Gmail Drafts (never sends autonomously)
- 🔒 **Secure by design** — OAuth tokens in OS credential store, no plaintext secrets, localhost-only API
- 📋 **Activity log** — see what JARVIS did, why it failed, and retry
- ⚙️ **Settings panel** — manage connections, AI provider key, and privacy preferences

### 🔜 Coming Soon
- 📅 Calendar — daily agenda, upcoming events, conflict detection
- 📁 Drive — search and summarize documents
- ⏰ Scheduled briefings — daily email digest with notifications
- 🖥️ Desktop tools — open approved apps/files/URLs
- 🔌 MCP interface — expose tools to compatible AI clients

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | [Tauri 2](https://tauri.app) (Rust) |
| Frontend | React + TypeScript + Vite |
| Local backend | Java 21 + Spring Boot 3 |
| AI provider | [Groq API](https://console.groq.com) (swappable) |
| Email | Gmail API via Google OAuth 2.0 |
| Local storage | SQLite |
| Packaging | Tauri NSIS installer — **no Java install required for end users** |

---

## Getting Started

### For End Users (Windows 10/11)

> 🚧 **Not yet released.** The first installable build will be published under [Releases](../../releases) after MVP is complete. Follow or star the repo to be notified.

### For Developers (Build from Source)

#### Prerequisites

| Tool | Version | Download |
|---|---|---|
| Java JDK | 21+ | [Adoptium](https://adoptium.net) |
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| Rust + Cargo | stable | [rustup.rs](https://rustup.rs) |
| Maven | 3.9+ | [maven.apache.org](https://maven.apache.org) |
| MSVC Build Tools | 2022 | [visualstudio.microsoft.com](https://visualstudio.microsoft.com/visual-cpp-build-tools/) — select "Desktop development with C++" |

#### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/jarvis.git
cd jarvis
```

#### 2. Configure your credentials

```bash
cp .env.example .env
# Edit .env and fill in:
# - GROQ_API_KEY
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
```

See **[docs/setup-windows.md](docs/setup-windows.md)** for a step-by-step guide to:
- Creating a Google Cloud project and enabling the Gmail API
- Configuring OAuth 2.0 credentials (Desktop app type)
- Adding yourself as a test user (required for unverified app warning)
- Getting a Groq API key

#### 3. Start the backend

```bash
cd services/local-backend
mvn spring-boot:run
```

#### 4. Start the desktop app

```bash
cd apps/desktop
npm install
npm run tauri dev
```

---

## Architecture Overview

```
┌──────────────────────────────────────┐
│  Tauri Desktop App (React + TS)      │
│  Floating pill · Chat panel          │
│  Settings · Activity log             │
└────────────────┬─────────────────────┘
                 │ localhost API
                 ▼
┌──────────────────────────────────────┐
│  Spring Boot Local Service           │
│  Gmail adapter · Groq AI provider   │
│  OAuth handler · SQLite · Scheduler  │
└──────┬──────────────────┬────────────┘
       │                  │
       ▼                  ▼
  Google APIs          Groq API
  (Gmail, later        (email analysis,
  Calendar/Drive)       summaries, drafts)
```

All communication between the UI and the backend happens over a **localhost-only API** secured with a per-session token. Nothing is exposed to the internet.

---

## Security & Privacy

- **Your Google password is never seen or stored.** JARVIS uses OAuth 2.0.
- **Tokens are stored in Windows Credential Manager**, not in files or logs.
- **Email content sent to Groq** is processed by an external AI provider — review [Groq's privacy policy](https://groq.com/privacy-policy) before use.
- **No email bodies are stored locally by default.** Only activity metadata is kept.
- **No autonomous actions.** JARVIS proposes; you approve.
- See [docs/security-and-privacy.md](docs/security-and-privacy.md) for the full model.

---

## Roadmap

| Milestone | Status |
|---|---|
| M0 — Architecture spike (Tauri ↔ Spring Boot process lifecycle) | 🔄 In Progress |
| M1 — Floating pill UI and expanded panel | ⬜ Planned |
| M2 — Google OAuth connection flow | ⬜ Planned |
| M3 — Gmail read path (search & retrieve) | ⬜ Planned |
| M4 — AI-powered email summaries | ⬜ Planned |
| M5 — Reply draft generation and Gmail Drafts save | ⬜ Planned |
| M6 — First Windows release (installable build) | ⬜ Planned |
| M7 — Google Calendar integration | ⬜ Planned |
| M8 — Google Drive & document summarization | ⬜ Planned |
| M9 — Scheduled daily briefings | ⬜ Planned |
| M10 — Desktop tools & MCP interface | ⬜ Planned |

---

## Contributing

Contributions are welcome. JARVIS is designed with a modular architecture so new integrations can be added without touching the core UI or orchestration logic.

- Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR
- Check [open issues](../../issues) for things to work on
- All secrets, personal data, and `.env` files must stay out of commits — see [docs/security-and-privacy.md](docs/security-and-privacy.md)

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

<div align="center">
  <sub>Built by <a href="https://github.com/YOUR_USERNAME">YOUR_NAME</a> · Inspired by the idea that a good assistant stays out of your way until you need it.</sub>
</div>
