# JARVIS — Open-Source Desktop AI Assistant

> **Project Blueprint** — Project brief, architecture, UI/UX wireframes, security model, roadmap, and open-source plan.

**Version:** 1.0 · **Date:** 20 October 2026 · **Status:** Planning draft

---

## Document map

1. Executive summary
2. Project brief and goals
3. Scope: MVP, later releases, and non-goals
4. Proposed technology stack
5. System architecture and key flows
6. UI/UX concept and wireframes
7. Functional requirements and user stories
8. Security, privacy, and trust model
9. Cost model and operating assumptions
10. Development roadmap and milestones
11. Repository structure and engineering practices
12. Testing strategy and acceptance criteria
13. Risks, dependencies, and open decisions
14. Initial implementation checklist


---

- 1. Executive summary

- 2. Project brief and goals

- 3. Scope: MVP, later releases, and non-goals

- 4. Proposed technology stack

- 5. System architecture and key flows

- 6. UI/UX concept and wireframes

- 7. Functional requirements and user stories

- 8. Security, privacy, and trust model

- 9. Cost model and operating assumptions

- 10. Development roadmap and milestones

- 11. Repository structure and engineering practices

- 12. Testing strategy and acceptance criteria

- 13. Risks, dependencies, and open decisions

- 14. Initial implementation checklist


## 1. Executive summary

JARVIS is a proposed open-source, desktop-first AI assistant. Its signature interaction is a small floating pill or island that can expand into a conversational panel, show task progress, and surface actionable results without requiring a full-screen app. The design is inspired by the interaction pattern of a phone’s Dynamic Island, but adapted for desktop workflows rather than copied as a literal mobile UI.

The first release will focus on Gmail: search and read authorized messages, summarize important email, classify urgency and action requirements, extract dates and next steps, and prepare reply drafts. Calendar and Drive integrations follow once the core architecture is stable. Desktop automation and an MCP interface are later extensions. ChatGPT-specific integration is explicitly out of scope for the initial release.


| Guiding principle  Build a reliable assistant that proposes and performs bounded actions—not an unrestricted agent with access to everything. Read-only features come first; write actions require explicit user approval. |
| --- |


| Item | Decision |
| --- | --- |
| Product type | Native desktop application with a floating, expandable assistant UI |
| Primary platform for MVP | Windows 10/11; keep the architecture portable where practical |
| Core stack | Tauri + React/TypeScript + local Spring Boot service + Groq API |
| Initial integration | Gmail API using Google OAuth 2.0 |
| Local storage | SQLite for settings, sync state, and minimal task history; avoid storing email bodies by default |
| Distribution model | Open-source repository; users configure their own Google OAuth credentials and Groq API key |
| Cost target | Aim for ₹0 for personal development and local use, subject to free-tier limits and Google requirements |


## 2. Project brief and goals


### 2.1 Problem statement

People spend time switching between email, calendars, documents, and desktop applications. Existing AI chat interfaces may not be available in every plan or may not offer the exact integrations a user needs. JARVIS aims to provide a configurable, open-source assistant that runs on the user's computer and connects to services only after the user authorizes them.


### 2.2 Product vision

A lightweight desktop companion that stays available when needed, communicates through natural language, and helps users turn information into actions while keeping permissions visible and user control explicit.


### 2.3 Target users

- Students and job seekers managing recruiter messages, placement announcements, deadlines, and study documents.

- Developers and knowledge workers who want a configurable assistant for email, calendar, documents, and local workflows.

- Open-source contributors who want to add integrations, tools, and model providers.


### 2.4 Primary goals

1. Provide a compact floating launcher that can expand into a useful assistant panel.

1. Summarize and prioritize Gmail messages using a configurable AI provider, starting with Groq.

1. Draft replies grounded in the selected email and save them as Gmail drafts.

1. Keep Google authentication, model keys, and user data under the user's control.

1. Use a modular architecture so Calendar, Drive, local files, and other integrations can be added without rewriting the core.

1. Make the project understandable and reproducible for open-source contributors.


### 2.5 Success measures


| Measure | MVP target |
| --- | --- |
| Time to first successful connection | A new user can follow setup instructions and connect Gmail without editing source code |
| Summary usefulness | Summary includes sender, subject, reason for priority, action, and relevant dates where present |
| Draft safety | MVP creates drafts only; it never sends email autonomously |
| Transparency | Users can inspect which email(s) were used and which tool was called |
| Reliability | Graceful handling of revoked consent, quota errors, network failure, and malformed model output |
| Portability | Core backend and integration code are not tightly coupled to the floating UI |


## 3. Scope: MVP, later releases, and non-goals


### 3.1 MVP — Gmail-first desktop assistant

- Floating pill/launcher that remains on top when enabled, with minimize/expand/close controls.

- Conversational panel with a text input and a small set of suggested actions.

- Google OAuth connection flow and secure token handling.

- Search and retrieve Gmail messages within user-selected criteria or a recent time window.

- Classify messages into categories such as recruiter/job, college notice, deadline, reply needed, and informational.

- Summarize selected or recent messages and extract dates/actions with links to source messages.

- Generate a reply draft and save it to Gmail Drafts; user reviews it in Gmail before sending.

- Settings for Groq API key, model selection where supported, email scan window, and categories.

- Local activity history showing completed, failed, and pending operations without retaining full email content by default.


### 3.2 Subsequent releases


| Release | Capabilities |
| --- | --- |
| R1 — Calendar | Read upcoming events, daily briefing, conflict detection, create events only after confirmation |
| R2 — Drive & documents | Search files, retrieve supported Google Docs/PDF/text content, summarize, cite file links |
| R3 — Scheduled briefings | Daily scan on a configurable schedule; notifications; deduplication and retry policy |
| R4 — Desktop tools | Open approved apps/files/URLs, search user-approved folders, run predefined safe workflows |
| R5 — Extension system | Documented tool interface, integration modules, community contributions |
| R6 — MCP interface | Expose selected tools to compatible AI clients; ChatGPT integration remains optional and platform-dependent |


### 3.3 Explicit non-goals for the first release

- No autonomous email sending.

- No unrestricted shell access or arbitrary command execution from model output.

- No full remote-control or screen-reading agent.

- No cloud-hosted central service that stores all user email.

- No ChatGPT-specific integration in the MVP.

- No promise of universal Google Keep API support; validate account and API eligibility before planning it.

- No vector database/RAG layer until the supported document corpus justifies it.


## 4. Proposed technology stack


| Layer | Proposed technology | Why / notes |
| --- | --- | --- |
| Desktop shell | Tauri | Native desktop packaging and system integration with a web UI; Rust is used for native commands/plugins. |
| Frontend | React + TypeScript + Vite | Reusable UI components, fast iteration, and a familiar ecosystem. |
| Local backend | Java + Spring Boot | Business logic, OAuth callback handling, integration services, validation, and orchestration. |
| AI inference | Groq API | Already familiar from RGPVMate; keep provider behind an interface so it can be replaced. |
| Email | Gmail API | Search and retrieve messages; create drafts; add only the scopes needed for each capability. |
| Calendar | Google Calendar API (later) | Read events first; write actions require confirmation. |
| Files | Google Drive API (later) | Search and retrieve supported content, then extract/summarize locally or through the configured model provider. |
| Authentication | Google OAuth 2.0 | User consent; no collection of Google passwords. |
| Local database | SQLite | Settings, integration metadata, sync cursors, and minimal task history; keep sensitive content out unless necessary. |
| Scheduling | Spring scheduling for a running service; OS startup/scheduler strategy to be decided | A scheduled job cannot run if the app/service is stopped. User-visible status is needed. |
| Packaging | Tauri bundling; installer per OS | Start with Windows. Expand to macOS/Linux after validating native behavior. |
| Testing | JUnit 5, Spring Boot Test, frontend component tests, integration tests | Test service logic independently of the floating UI and external APIs. |
| Version control | Git + GitHub | Issues, releases, contribution guidelines, CI, and public roadmap. |


| Architecture caveat  Tauri is not a Java desktop framework. The clean split is a Tauri/React shell plus a local Spring Boot service. This adds packaging and process-management complexity, so the first technical spike must prove that the desktop app can start, monitor, and stop the local backend reliably. |
| --- |


### 4.1 Provider abstraction

Do not call Groq directly from every business service. Define an AI provider interface so model-specific request/response handling stays isolated.

```text
interface AiProvider {
```

```text
StructuredResult analyzeEmail(EmailContext context, AnalysisOptions options);
```

```text
DraftResult draftReply(EmailContext context, ReplyInstructions instructions);
```

```text
}
```

The interface is illustrative pseudocode, not a complete implementation. Validate structured output server-side; never trust a model response as an executable instruction.


### 4.2 Google integration abstraction

Keep Google-specific API calls in dedicated adapters (for example, GmailClient) behind application-level services. This makes token management, error handling, testing, and future providers easier to maintain.


## 5. System architecture and key flows


### 5.1 Logical architecture

```text
┌──────────────────────────────────────────────────────────┐
```

```text
│                    Desktop application                   │
```

```text
│  Tauri shell + React/TypeScript                           │
```

```text
│  Floating pill • Expanded chat • Settings • Activity     │
```

```text
└────────────────────────────┬─────────────────────────────┘
```

```text
│ localhost API / IPC boundary
```

```text
▼
```

```text
┌──────────────────────────────────────────────────────────┐
```

```text
│                 Local Spring Boot service                │
```

```text
│  API controllers • Agent orchestrator • Policy checks    │
```

```text
│  Gmail service • AI provider adapter • Scheduler         │
```

```text
│  SQLite repository • Audit/activity metadata              │
```

```text
└───────────────┬─────────────────────┬────────────────────┘
```

```text
│                     │
```

```text
▼                     ▼
```

```text
Google APIs / OAuth        Groq API
```

```text
Gmail first; later         email analysis,
```

```text
Calendar and Drive         summaries and drafts
```


### 5.2 Email summary flow

1. User asks for a summary or starts a configured scan.

1. Backend validates the request and the user's active Google authorization.

1. Gmail adapter searches within the allowed date/label/filter criteria.

1. Backend fetches only the message fields and content needed for the task.

1. Email content is marked as untrusted data and passed to the model with instructions that it must not override system policy or trigger unrelated actions.

1. Model returns a constrained structured result: category, priority, summary, dates, action required, and optional draft.

1. Backend validates the result and maps dates/links to the source message where possible.

1. UI displays the summary, source email, confidence/limitations, and available next action.


### 5.3 Reply drafting flow

1. User selects a message and requests a reply, or approves a suggested draft.

1. Assistant extracts the email context and the user's explicit reply requirements.

1. AI generates a draft; backend checks that it does not contain unsupported claims or unexpected recipients.

1. User reviews/edits the draft.

1. Backend creates a Gmail draft only after the user chooses Save Draft.

1. Sending is outside the MVP. If added later, it must be a separate operation with explicit confirmation of recipient, subject, and body.


### 5.4 Floating window behavior

- Collapsed state: compact pill near a screen edge; displays status, notification count, or an activity indicator.

- Expanded state: chat panel anchored to the pill with current task, results, and action buttons.

- Task state: brief progress state such as “Searching Gmail…”; no fake progress percentages.

- Dismissal: clicking outside may collapse the panel, but must not discard unsaved drafts or interrupt an operation silently.

- Accessibility: keyboard focus, visible focus indicators, screen-reader labels, scalable text, and reduced-motion option.

- Positioning: user can reposition the pill; remember its position per display setup and recover safely if a monitor is disconnected.

- Window behavior: always-on-top should be configurable, not mandatory; provide a tray/menu-bar fallback for users who dislike overlays.


## 6. UI/UX concept and wireframes

Design direction: a quiet, compact desktop companion. The floating pill is the primary entry point, not the entire application. It should stay visually unobtrusive, expand only when needed, and make current activity and permissions clear.


### 6.1 State A — Collapsed floating pill

```text
┌─────────────────────────────────────────────┐
```

```text
│  ◉ JARVIS       Ready                  ▴   │
```

```text
└─────────────────────────────────────────────┘
```

```text
desktop workspace
```

Intent: one-click access. The pill can show Ready, Working, Needs approval, or an unread/attention count. Avoid showing sensitive email subjects on the collapsed surface by default.


### 6.2 State B — Expanded assistant panel

```text
┌─────────────────────────────────────────────────────┐
```

```text
│  ◉ JARVIS     Gmail connected              ─  □  ×  │
```

```text
├─────────────────────────────────────────────────────┤
```

```text
│  Good morning. What would you like me to do?        │
```

```text
│                                                     │
```

```text
│  [ Summarize important emails ] [ Today's agenda ] │
```

```text
│  [ Find a document ]            [ Draft a reply ]   │
```

```text
│                                                     │
```

```text
│  Recent activity                                    │
```

```text
│  • Gmail summary completed                    View  │
```

```text
│  • 1 draft awaiting your review               Open  │
```

```text
├─────────────────────────────────────────────────────┤
```

```text
│  Ask JARVIS…                                  [➤]   │
```

```text
└─────────────────────────────────────────────────────┘
```

Intent: a focused command surface. Keep suggested actions configurable and hide integrations that are not connected.


### 6.3 State C — Daily email briefing

```text
┌─────────────────────────────────────────────────────┐
```

```text
│  Gmail briefing                         Today  09:00 │
```

```text
├─────────────────────────────────────────────────────┤
```

```text
│  HIGH PRIORITY  •  2 items                           │
```

```text
│  1. Recruiter interview invitation                  │
```

```text
│     Interview time found in message.                │
```

```text
│     [Open email] [Draft reply]                       │
```

```text
│                                                     │
```

```text
│  2. Placement registration deadline                 │
```

```text
│     Deadline mentioned: 22 Oct (verify source).      │
```

```text
│     [Open email] [Mark reviewed]                     │
```

```text
│                                                     │
```

```text
│  OTHER EMAILS  •  6 summarized                       │
```

```text
│  [Show all] [Adjust filters]                         │
```

```text
└─────────────────────────────────────────────────────┘
```

Intent: prioritize next actions, not just generate a wall of text. Every extracted deadline should link back to its source and be treated as unverified until checked.


### 6.4 State D — Draft review and approval

```text
┌─────────────────────────────────────────────────────┐
```

```text
│  Draft reply • Not sent                              │
```

```text
├─────────────────────────────────────────────────────┤
```

```text
│  To: recruiter@example.com                           │
```

```text
│  Subject: Re: Interview invitation                   │
```

```text
│  ─────────────────────────────────────────────────  │
```

```text
│  Dear Hiring Team,                                   │
```

```text
│                                                     │
```

```text
│  Thank you for the invitation. I can confirm…       │
```

```text
│                                                     │
```

```text
│  [Edit] [Regenerate] [Save to Gmail Drafts]          │
```

```text
│                                                     │
```

```text
│  Sending is not available in this release.           │
```

```text
└─────────────────────────────────────────────────────┘
```

Intent: show recipient and subject clearly; label the draft as unsent; do not imply that a draft has been sent.


### 6.5 State E — Connections and permissions

```text
┌─────────────────────────────────────────────────────┐
```

```text
│  Settings → Connections                              │
```

```text
├─────────────────────────────────────────────────────┤
```

```text
│  Gmail           Connected      [Manage access]      │
```

```text
│  Calendar        Not connected  [Connect]            │
```

```text
│  Drive           Not connected  [Connect]            │
```

```text
│                                                     │
```

```text
│  AI provider                                         │
```

```text
│  Groq API key     Configured     [Replace key]       │
```

```text
│                                                     │
```

```text
│  Privacy                                             │
```

```text
│  [ ] Keep email content in local history             │
```

```text
│  [x] Ask before creating drafts                      │
```

```text
│  [x] Show activity log                               │
```

```text
└─────────────────────────────────────────────────────┘
```

Intent: clear service-by-service consent and understandable data-retention controls. Do not display full API keys after saving them.


### 6.6 UX rules

- Use explicit states: Ready, Working, Needs approval, Completed, Failed, and Disconnected.

- Show sources for summaries and extracted facts; make it easy to open the original email/document.

- Separate suggestions from completed actions.

- Do not create or modify data merely because the model suggested doing so; require a user action for writes.

- Provide Cancel for long-running operations and a retry path for transient failures.

- Keep the collapsed pill private by default; sensitive content appears only after expansion/unlock if such a feature is added.

- Offer a conventional full-window mode for accessibility and users who do not want a floating overlay.


## 7. Functional requirements and user stories


| ID | Requirement / user story | Priority |
| --- | --- | --- |
| FR-01 | As a user, I can connect and disconnect Gmail through Google's OAuth consent flow. | P0 |
| FR-02 | As a user, I can request a summary of recent or selected messages. | P0 |
| FR-03 | As a user, I can see category, priority, summary, action required, and source link for each important email. | P0 |
| FR-04 | As a user, I can generate, edit, and save a reply as a Gmail draft. | P0 |
| FR-05 | As a user, I can configure the Groq key without committing it to source control. | P0 |
| FR-06 | As a user, I can inspect activity and see why an operation failed. | P0 |
| FR-07 | As a user, I can revoke access and clear local assistant data. | P0 |
| FR-08 | As a user, I can configure a daily scan and understand that it only runs while its execution service is active. | P1 |
| FR-09 | As a user, I can connect Calendar and view upcoming events. | P1 |
| FR-10 | As a user, I can search Drive and summarize supported documents. | P1 |
| FR-11 | As a user, I can enable/disable always-on-top and reposition the floating pill. | P0 |
| FR-12 | As a developer, I can add an integration without changing the UI's core orchestration logic. | P1 |
| FR-13 | As a user, I can use the assistant in a full-window mode if the overlay is inconvenient. | P1 |


### 7.1 Suggested API boundaries

```text
GET    /api/health
```

```text
GET    /api/connections
```

```text
POST   /api/connections/google/start
```

```text
POST   /api/connections/google/disconnect
```

```text
GET    /api/gmail/messages?query=...&after=...
```

```text
GET    /api/gmail/messages/{messageId}
```

```text
POST   /api/gmail/summary
```

```text
POST   /api/gmail/messages/{messageId}/reply-draft
```

```text
GET    /api/activity
```

```text
GET    /api/settings
```

```text
PUT    /api/settings
```

These are proposed local backend endpoints. They must be protected against requests from untrusted origins and should not be exposed to the public internet by default.


## 8. Security, privacy, and trust model


### 8.1 Authentication and secrets

- Use Google OAuth 2.0; never request or store the user's Google password.

- Request the narrowest practical scopes. Start with read-only email access; add draft creation only when needed.

- Use the operating system's secure credential store for refresh tokens and provider keys where feasible. Do not store secrets as plaintext in SQLite or logs.

- Never commit credentials, .env files, client secrets, refresh tokens, or real user data to GitHub.

- Support disconnect/revoke flows and clearly explain what local data is removed.


### 8.2 Data minimization

- Process only the messages required for the user's query or configured scan window.

- Avoid retaining full email bodies by default; store minimal metadata needed for deduplication and activity history.

- Explain that email content sent to Groq is processed by an external provider. Users should review that provider's terms and privacy policy.

- Do not send attachments to the model unless a user explicitly requests a supported workflow.

- Offer clear retention settings and a way to clear local history.


### 8.3 Prompt injection and tool security

- Treat emails, calendar descriptions, and documents as untrusted data—not instructions that can change system policy.

- Use allowlisted tools and typed input schemas; never execute arbitrary model-generated shell commands.

- Separate read tools from write tools.

- Require explicit approval for creating drafts, calendar events, file modifications, or any future sending action.

- For future sending, show recipient, subject, and body in a confirmation screen and require a deliberate confirmation action.

- Apply tool-call limits, timeouts, rate limits, and validation; log tool names and outcomes without logging secrets or unnecessary message content.


### 8.4 Google OAuth verification considerations

A personal development setup and a public application have different requirements. Public distribution that asks other users to authorize Google data can require OAuth consent-screen configuration, verification for sensitive/restricted scopes, and potentially additional security assessment depending on the scopes and how data is handled. Confirm the current Google requirements before announcing a public release. Open-source code does not waive these obligations.


## 9. Cost model and operating assumptions


| Item | Target approach | Cost assumption / caveat |
| --- | --- | --- |
| Development tools | Open-source frameworks and local development | ₹0 |
| Gmail API | Standard personal usage | Typically no direct API charge within quotas; Google policies and quotas apply |
| Groq | Free tier for prototype | ₹0 while within available limits; free quotas/models can change |
| Database | Local SQLite | ₹0 |
| Hosting | Run locally for MVP | ₹0; app/service must be running for scheduled work |
| Public distribution | GitHub releases | Can start free; CI/build minutes and artifact storage have limits |
| Always-on cloud operation | Defer until needed | May cost money; not required for a local desktop MVP |
| Google OAuth verification | Investigate before public multi-user release | Possible compliance or assessment costs depending on scopes and architecture |
| ChatGPT integration | Out of scope for MVP | Plan/workspace-dependent; no need to pay for this to build the desktop app |


| Budget policy  Aim for ₹0 while building and testing locally. Do not design the MVP around paid hosting or a paid AI plan. Before publishing for general users, verify provider quotas, Google OAuth requirements, and the cost of any required security assessment. |
| --- |


## 10. Development roadmap and milestones


| Milestone | Deliverable | Exit criteria |
| --- | --- | --- |
| M0 — Architecture spike | Tauri shell launches a local Spring Boot service; health check works | Start/stop, port selection, logs, and packaged build behavior are understood |
| M1 — UI foundation | Floating pill, expanded chat panel, settings screen, full-window fallback | Window can be repositioned, collapsed/expanded, and used with keyboard navigation |
| M2 — Google auth | OAuth flow and secure token storage | Connect, refresh, disconnect, and revoked-consent scenarios tested |
| M3 — Gmail read path | Search and retrieve messages | User can select a date/query and inspect source messages |
| M4 — AI summaries | Groq adapter, structured classification and summary | Schema validation, malformed output, quota errors, and prompt-injection tests pass |
| M5 — Reply drafts | Generate/edit/save Gmail drafts | No send operation exists; recipient and content are visible before saving |
| M6 — Local release | Windows package, README, setup guide, screenshots | Fresh-machine setup works using documented steps |
| M7 — Calendar | Read events and produce daily agenda | Correct timezone handling and source links |
| M8 — Drive | Search and summarize supported documents | Supported formats and file-size limitations documented |
| M9 — Scheduled workflows | Daily briefing, deduplication, notification and retry | Behavior is clear when app/service is closed or offline |
| M10 — Desktop tools / MCP | Permission-controlled local actions and optional MCP server | Tools are allowlisted, auditable, and disabled by default until configured |

Schedule estimate: do not commit to a fixed calendar until the M0 spike is complete. A working Gmail-first prototype is a more useful milestone than trying to estimate every later integration upfront.


## 11. Repository structure and engineering practices

Suggested monorepo structure:

```text
jarvis/
```

```text
├── apps/
```

```text
│   └── desktop/                 # Tauri + React + TypeScript
```

```text
│       ├── src/
```

```text
│       ├── src-tauri/
```

```text
│       └── package.json
```

```text
├── services/
```

```text
│   └── local-backend/           # Spring Boot
```

```text
│       ├── src/main/java/
```

```text
│       │   └── .../
```

```text
│       │       ├── api/
```

```text
│       │       ├── application/
```

```text
│       │       ├── domain/
```

```text
│       │       ├── integrations/
```

```text
│       │       │   ├── gmail/
```

```text
│       │       │   ├── googleauth/
```

```text
│       │       │   └── ai/
```

```text
│       │       ├── security/
```

```text
│       │       ├── persistence/
```

```text
│       │       └── scheduling/
```

```text
│       └── src/test/
```

```text
├── docs/
```

```text
│   ├── architecture.md
```

```text
│   ├── security-and-privacy.md
```

```text
│   ├── setup-windows.md
```

```text
│   ├── troubleshooting.md
```

```text
│   └── roadmap.md
```

```text
├── scripts/
```

```text
├── .github/
```

```text
│   ├── ISSUE_TEMPLATE/
```

```text
│   └── workflows/
```

```text
├── .env.example
```

```text
├── .gitignore
```

```text
├── CONTRIBUTING.md
```

```text
├── LICENSE
```

```text
└── README.md
```


### 11.1 Engineering practices

- Use feature branches and small pull requests.

- Keep secrets and personal data out of tests and logs.

- Create interfaces around external services and mock them in unit tests.

- Add structured error codes for authentication, quota, network, parsing, and model failures.

- Use a documented configuration file or settings UI; validate settings on save.

- Add CI for Java tests, frontend checks, formatting/linting, and build verification.

- Choose a permissive or copyleft open-source license deliberately; record the decision before the first public release.


## 12. Testing strategy and acceptance criteria


### 12.1 Test layers


| Layer | What to test |
| --- | --- |
| Unit tests | Email classification mapping, date extraction validation, prompt construction, policy checks, settings validation |
| Service tests | Gmail search/retrieval, draft creation, OAuth lifecycle using mocked clients |
| Contract tests | Groq structured output parsing, Google API response mapping, error normalization |
| Security tests | No secret leakage, origin/localhost protections, prompt-injection cases, denied tool calls |
| UI tests | Expand/collapse, focus behavior, draft review state, loading/error/empty states |
| Manual end-to-end | Fresh setup, connect Gmail, summarize a small test set, save a draft, revoke access |


### 12.2 MVP acceptance checklist

- A new user can configure their own Groq API key without exposing it in the frontend bundle or repository.

- The app can connect to Gmail through the official OAuth flow and can disconnect cleanly.

- The user can summarize a bounded set of emails and open the source message for each result.

- The assistant distinguishes facts found in an email from inferred recommendations.

- Extracted deadlines include source references and are not silently treated as confirmed calendar events.

- The user can review and save a reply as a Gmail draft.

- The MVP contains no autonomous send-email function.

- The floating UI can be collapsed and expanded, and a full-window alternative exists.

- Errors are understandable and recoverable where possible.

- Setup documentation explains OAuth setup, API-key configuration, permissions, data handling, and known limitations.


## 13. Risks, dependencies, and open decisions


| Risk / decision | Impact | Mitigation / next action |
| --- | --- | --- |
| Tauri + Spring Boot process lifecycle | Packaging may be more complex than the UI | Resolve in M0 before implementing integrations |
| Google OAuth verification | Can block or delay public onboarding | Use narrow scopes; investigate verification requirements early |
| Free-tier limits | AI requests may be throttled or model availability may change | Provider abstraction, retries with backoff, graceful quota errors |
| Model hallucination | Wrong summaries or draft content | Source links, structured output, validation, user review |
| Prompt injection in messages/documents | Could lead to unsafe tool selection | Treat content as untrusted, tool allowlists, separate policy enforcement |
| Always-on scheduling | Jobs do not run if the app/service is stopped | Define startup/background-service behavior and show last-run status |
| Floating UI interference | Overlay may obstruct apps or frustrate users | Configurable position, always-on-top toggle, hotkey, full-window mode |
| Cross-platform support | Native behavior differs by OS | Target Windows first; keep integrations portable and test other OSes later |
| Google Keep support | API eligibility may not cover all personal accounts | Defer; validate the account type and supported API operations first |
| Local token storage | Compromise could expose account access | Use OS credential storage, least-privilege scopes, revoke/clear controls |


### 13.1 Decisions to finalize during the first technical spike

- Windows-only first release or Windows-first with immediate cross-platform requirements.

- Whether Spring Boot runs as a child process managed by Tauri or as a separately installed local service.

- How the local service binds to localhost and authenticates requests from the desktop UI.

- Exact Gmail scopes needed for read-only access and draft creation.

- Which Groq model is currently available and suitable under the user's free-tier quota.

- Whether the floating pill should launch at login by default or only when the user opens JARVIS.

- Which local notification mechanism to use for completed daily briefings.

- License choice and contribution policy before the first public release.


## 14. Initial implementation checklist

Do these in order. Do not start by implementing every Google integration.

1. Create the GitHub repository and add README, license placeholder, and issue roadmap.

1. Create a minimal Tauri + React + TypeScript app with collapsed and expanded states.

1. Create a Spring Boot service with a health endpoint and a local-only API boundary.

1. Prove the desktop shell can start, monitor, and stop the backend reliably.

1. Implement a settings screen and secure storage for the Groq API key.

1. Create the Google Cloud project and configure OAuth for development.

1. Implement Gmail read-only connection and message retrieval.

1. Add Groq-backed structured email summaries and validation.

1. Add reply drafting and Gmail Drafts integration, still without sending.

1. Add tests for authentication failure, quota limits, malformed AI output, and prompt injection.

1. Package a local Windows build and test setup from a clean environment.

1. Publish a documented alpha only after reviewing secrets, permissions, and data retention.


## Closing recommendation

Treat the floating Dynamic Island-inspired interface as the product's signature interaction, but keep the underlying assistant modular. Start with a small floating launcher and an expandable chat/results panel; build Gmail read, summarize, and draft workflows end-to-end; then add Calendar, Drive, scheduled briefings, and controlled desktop tools. Keep ChatGPT integration separate and deferred. This path produces a useful application early while preserving a credible route to a broader open-source assistant.
