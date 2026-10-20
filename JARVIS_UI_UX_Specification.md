# JARVIS UI/UX Specification

> **Product:** JARVIS — Open-Source Desktop AI Assistant  
> **Document:** UI/UX design specification  
> **Version:** 1.0 · **Status:** Proposed design  
> **Scope:** Independent desktop application. ChatGPT/MCP integration is deferred and excluded from this specification.

## 1. Purpose

This document translates the approved visual direction into a practical interface specification for implementation with React, TypeScript, Tauri, and a local Spring Boot backend. JARVIS should feel like a quiet desktop companion: available when needed, unobtrusive when idle, and clear about what it is doing.

The defining pattern is a compact floating pill inspired by the interaction concept of Dynamic Island, adapted to desktop use. The UI should not resemble a science-fiction dashboard. Avoid excessive glow, busy gradients, persistent large overlays, dense cards, and decorative animation.

## 2. Product principles

- **Minimal by default:** The collapsed pill contains only the brand, status, and a small interaction affordance.
- **Progressive disclosure:** Reveal detail only when the user expands the assistant or requests a result.
- **Quiet visual hierarchy:** Typography, spacing, and alignment do most of the work; color is used sparingly.
- **Source-grounded AI:** Summaries and extracted dates should link to the email or document they came from.
- **No ambiguity around actions:** Suggestions, drafts, completed actions, failures, and approval requests must look distinct.
- **User control first:** The assistant must not send email or modify data simply because a model recommended it.
- **Accessible, not just attractive:** Support keyboard navigation, visible focus, readable contrast, reduced motion, and a conventional full-window mode.
- **High-resolution UI:** Render with native text, CSS, vector icons, and components. Do not use a rasterized mockup as the actual app interface.

## 3. Visual identity and design tokens

### 3.1 Brand character

Quiet · capable · focused · private · understated.

### 3.2 Dark theme tokens

| Token | Value | Use |
|---|---|---|
| `--bg-base` | `#0D1117` | Desktop panel background |
| `--bg-surface` | `#151B23` | Main assistant surface |
| `--bg-elevated` | `#1D2630` | Input, hover, nested elements |
| `--border-subtle` | `#2B3642` | Dividers and outlines |
| `--text-primary` | `#E6EDF3` | Primary content |
| `--text-secondary` | `#9BA8B5` | Supporting copy and metadata |
| `--accent` | `#42D6C5` | Primary accent, focus, selected state |
| `--accent-muted` | `#173B3A` | Subtle accent background |
| `--warning` | `#E7B567` | Pending attention, deadline warning |
| `--danger` | `#F07178` | Errors and destructive actions |
| `--success` | `#79C99E` | Confirmed completion |

Use the accent for selected states and primary actions, not for every icon or border. Status must never rely on color alone; include a label or symbol.

### 3.3 Light theme companion

| Token | Value | Use |
|---|---|---|
| `--bg-base` | `#F7F8FA` | Main background |
| `--bg-surface` | `#FFFFFF` | Main surfaces |
| `--bg-elevated` | `#F0F3F5` | Input and nested elements |
| `--border-subtle` | `#DCE3E8` | Dividers and outlines |
| `--text-primary` | `#17212B` | Primary content |
| `--text-secondary` | `#5F6E79` | Supporting copy and metadata |
| `--accent` | `#087F78` | Primary accent and focus |
| `--accent-muted` | `#DFF4F0` | Selected backgrounds |

Both themes share the same component geometry, spacing, interactions, and hierarchy. Theme switching must not change layout or hide available features.

### 3.4 Typography

- Prefer a native system sans-serif stack for a crisp, native feel: Windows uses Segoe UI; fall back to system sans-serif.
- Use a compact, readable scale rather than oversized display typography.
- Suggested scale: 12px metadata, 13–14px supporting text, 14px body, 16–18px panel headings, 20px welcome heading.
- Use medium or semibold weights for headings and sender/subject emphasis. Avoid all-caps outside compact labels.
- Body copy should use comfortable line height around 1.45–1.6.

### 3.5 Spacing, radii, and elevation

- Base spacing unit: 4px.
- Common spacing: 4, 8, 12, 16, 20, 24, 32px.
- Floating pill: fully rounded ends.
- Expanded panel: 14–18px radius.
- Inputs and action chips: 9–12px radius.
- Borders: typically 1px, low-contrast.
- Shadows: soft and restrained, only enough to separate the overlay from windows behind it.
- Avoid strong blur/glassmorphism as a required effect; the UI must remain legible without background blur.

## 4. Application shell and floating interaction

### 4.1 Collapsed pill

**Purpose:** Persistent, glanceable access without distracting from other applications.

Content:
- Small JARVIS mark/status ring.
- Label: “JARVIS”.
- Short state label when useful: “Ready”, “Working”, or “Needs approval”.
- Optional audio/listening indicator only when voice input is an enabled feature.
- A subtle expand affordance.

Behavior:
- Click or press Enter/Space to expand.
- Drag to reposition only from a defined drag area; do not make the whole pill impossible to click.
- Keyboard shortcut can show/hide the panel.
- Always-on-top should be configurable.
- Position should be remembered per display where practical.
- If the saved position is off-screen after display changes, recenter it safely.
- The default collapsed state must not expose email subjects, sender names, or message content.

States:
1. **Idle / Ready:** quiet status dot and “Ready”.
2. **Working:** restrained animated ring; accessible label “Working”.
3. **Needs approval:** amber indicator plus explicit text or badge.
4. **Completed:** brief completion state, then return to Ready.
5. **Error / Disconnected:** clear state label and recovery action when expanded.
6. **Listening (future):** visibly distinct and user-controlled; microphone state cannot be hidden.

### 4.2 Expanded assistant panel

The expanded panel anchors to the pill and contains:
- Header with JARVIS mark, connected-state summary, and window controls.
- A concise contextual greeting, not a large welcome hero.
- Three or four optional quick actions.
- Recent task/activity items only if there are useful results.
- A command composer fixed near the bottom.
- Visible stop/cancel action during long-running work.

Recommended quick actions for the MVP:
- “Summarize emails”
- “Draft a reply”
- “Find a document” (disabled until Drive is available)
- “Today’s agenda” (disabled until Calendar is available)

Do not present disabled future integrations as if they already work. Either hide unavailable actions or display a clear “Coming later” state.

### 4.3 Panel dimensions and responsive behavior

Initial desktop target:
- Collapsed pill: approximately 220–300px wide and 44–56px tall.
- Expanded panel: approximately 380–460px wide and 520–680px tall.
- Respect screen work area, display scaling, and taskbar position.
- On smaller screens, reduce height and keep the composer visible.
- Long content should scroll inside the panel; do not force the outer window to grow without bounds.
- Offer “Open full window” for longer documents, settings, and accessibility.

These dimensions are initial design targets. Confirm with an actual Tauri prototype and Windows scaling tests rather than treating them as fixed platform requirements.

## 5. Screen and state specifications

### 5.1 State A — Collapsed floating pill

**Layout**
- Single horizontal row.
- Status ring / mark at left.
- “JARVIS” label.
- State label or small action affordance at right.
- No cards, summary copy, or sensitive data.

**Acceptance criteria**
- The pill is readable on light and dark desktop backgrounds.
- Hit targets are large enough to operate comfortably.
- Hover appearance is subtle and does not cause layout movement.
- The window does not unexpectedly steal keyboard focus while the user types in another app.

### 5.2 State B — Expanded assistant home

**Header**
- JARVIS label and connection indicator.
- Minimize/collapse and close controls.
- Settings access available without crowding the header.

**Content**
- Greeting: “Good morning” or neutral “How can I help?”
- Brief supporting line such as “What would you like me to take care of?”
- Quick-action chips.
- Small recent-activity section only if non-empty.

**Composer**
- Placeholder: “Ask JARVIS…”
- Send action and optional microphone affordance only if voice is implemented.
- Enter sends; Shift+Enter inserts a line break.
- While a request is active, show progress and allow cancellation.

**Empty state**
- Explain that integrations need connecting; present “Connect Gmail”.
- Do not fabricate emails, meetings, or completed activity.

### 5.3 State C — Email briefing

**Purpose:** Identify messages that need attention and make the next action easy.

**Hierarchy**
1. Heading: “Email briefing” and date/time range.
2. Priority summary, such as “2 need attention”.
3. Each message: sender, subject, short summary, category, action status, and timestamp.
4. Actions: “Open email”, “Draft reply”, or “Mark reviewed” where implemented.
5. Secondary group for informational messages.

**Message classification**
- Job / placement
- Recruiter / interview
- College notice
- Deadline / action required
- Informational
- Unclassified

Categories should be configurable. Priority should be explainable and should not imply certainty the model does not have.

**Dates and source traceability**
- Extracted dates must link to the source message.
- Label uncertain extraction as “Date mentioned” rather than treating it as a verified deadline.
- Never silently create a calendar event from an extracted date.

**Empty state**
- “No important emails found in this period.”
- Show the scan window and allow the user to broaden it.

**Failure state**
- Explain whether Gmail is disconnected, the request failed, or a quota/network limit was reached.
- Provide a retry or reconnect action.

### 5.4 State D — Reply draft review

**Purpose:** Let the user inspect and edit an AI-generated response before saving it.

**Required content**
- State label: **“Draft · Not sent”**.
- Recipient and subject displayed clearly.
- Editable response body.
- “Regenerate” and “Edit” actions.
- Primary action: “Save to Gmail Drafts”.
- Source email link.

**Rules**
- The system must never imply that a message has been sent when it is only generated or saved as a draft.
- Validate recipient and subject before draft creation.
- Do not invent personal experience, qualifications, promises, or availability.
- If the original email is ambiguous, ask for clarification or make uncertainty obvious.
- Sending email is out of scope for the MVP.

### 5.5 State E — Connections and settings

Sections:
- **Connections:** Gmail initially; Calendar and Drive appear as future integrations until implemented.
- **AI provider:** Groq API key entry, model selector where supported, and connection/test status.
- **Appearance:** system/light/dark theme, animation preference, always-on-top, pill position reset.
- **Behavior:** scan window, categories, notification preference, startup behavior.
- **Privacy:** data retention, clear activity history, disconnect Google account.
- **About:** version, license, documentation, diagnostics.

Secret inputs must be masked after saving. Never display full tokens in logs or settings. Explain what permissions each connection requires.

### 5.6 State F — Activity and operation status

Each activity item should show:
- Action name.
- Source/integration used.
- Status: queued, working, needs approval, completed, failed, canceled.
- Timestamp.
- Concise result or actionable error.
- Link to related source item, when safe and available.

Do not show artificial progress percentages for operations that cannot report real progress. Prefer stages such as “Searching Gmail”, “Summarizing 8 messages”, and “Preparing draft”.

### 5.7 Future Calendar view

When Calendar integration is implemented:
- Display today/tomorrow and a compact chronological agenda.
- Each item shows title, local time, duration, and calendar/source.
- Surface clashes as suggestions, not as automatic rescheduling.
- Event creation requires a review step showing title, date, time zone, and attendees.
- Correct time-zone handling is required; never assume the computer time zone and calendar time zone are identical.

### 5.8 Future Drive search and document summary

When Drive is implemented:
- Search field with clear filters and file type.
- Results show filename, type, modified date, and link to the original.
- Summary panel separates key points, dates, and suggested actions.
- Cite the relevant document and, where possible, page/section.
- Explain unsupported formats or size limits rather than silently omitting content.
- Do not index or retain a whole Drive by default without a clear opt-in.

## 6. Primary user flows

### Flow 1 — First launch
1. User opens JARVIS.
2. Floating pill appears in a sensible safe position.
3. Expanding it shows the welcome panel and connection state.
4. User selects “Connect Gmail”.
5. Google consent flow opens through the official OAuth process.
6. After success, JARVIS displays the account connection state and available permissions.
7. User can run an explicit first summary.

### Flow 2 — Summarize important emails
1. User expands JARVIS and chooses “Summarize emails” or types a request.
2. UI shows “Searching Gmail”.
3. Backend retrieves only the requested message set.
4. UI shows the actual progress stage or a spinner with an accessible label.
5. Results are displayed with source links and priority explanations.
6. User opens a source email or requests a reply draft.

### Flow 3 — Draft a reply
1. User opens a message from the briefing.
2. User selects “Draft reply”.
3. Draft editor opens and shows “Draft · Not sent”.
4. User edits or regenerates the response.
5. User explicitly chooses “Save to Gmail Drafts”.
6. UI confirms the draft was saved; it does not claim the email was sent.

### Flow 4 — Connect/disconnect an integration
1. User opens Settings → Connections.
2. User can see each integration's state and permission summary.
3. User authorizes or disconnects the relevant account.
4. UI confirms the result and reflects revoked access.
5. The app handles token expiration/revocation with a clear reconnect path.

### Flow 5 — Cancel or recover from an error
1. User sees a clear Working or Failed state.
2. Long operations provide Cancel.
3. Errors are translated to useful language without exposing secrets or stack traces.
4. Retrying does not duplicate write actions.
5. The activity log records a minimal outcome.

## 7. Interaction, motion, and window behavior

- Expand/collapse transition target: roughly 140–220ms, ease-out; make reduced-motion settings available.
- Hover and focus changes should be subtle and consistent.
- Avoid constantly pulsing, glowing, or animating the pill.
- Always-on-top can be disabled.
- Collapsing the assistant must not discard a draft or interrupt a request without warning.
- Closing the panel should have a predictable meaning distinct from exiting the background service.
- Provide tray controls for Open, Pause scheduled scans (future), Settings, and Quit.
- When starting with Windows (if added), disclose it clearly and allow easy disable.
- Ensure multiple-monitor and display scaling behavior are tested before release.

## 8. Accessibility and content design

- All interactive elements support keyboard focus.
- Focus indicators remain visible on both themes.
- Use semantic labels for icon-only buttons.
- Ensure contrast for text and controls, especially muted secondary text.
- Status is communicated by text or icon in addition to color.
- Keep click targets comfortable; aim for approximately 32–40px for frequent controls and larger where appropriate.
- Avoid relying on hover to expose essential actions.
- Support system text scaling where the desktop shell permits.
- Error copy should explain what happened and the next step.
- Use plain, direct language. Prefer “Gmail disconnected — reconnect to continue” over technical exception messages.

## 9. Component inventory

Suggested reusable React components:
- `FloatingPill`
- `AssistantWindow`
- `AssistantHeader`
- `QuickActionChip`
- `CommandComposer`
- `TaskProgress`
- `ActivityItem`
- `EmailBriefing`
- `EmailSummaryCard`
- `PriorityBadge`
- `SourceLink`
- `ReplyDraftEditor`
- `ConnectionCard`
- `ThemeSelector`
- `SettingsSection`
- `EmptyState`
- `ErrorState`
- `ConfirmActionDialog`
- `ToastNotification`

Keep components presentational where possible. UI components should not call Gmail or Groq directly; they should communicate with typed backend APIs and handle loading/error states.

## 10. Frontend state model

Represent long-running actions with a finite set of explicit states:
- `idle`
- `queued`
- `running`
- `needs_approval`
- `completed`
- `failed`
- `canceled`

Avoid conflicting booleans such as `isLoading`, `isDone`, and `hasError` all being true at once. Use a single state plus task/result/error details.

Theme preference options:
- `system`
- `light`
- `dark`

Persist the user's preference locally. If system mode is selected, respond to the operating system theme without changing component geometry.

## 11. Design-to-implementation guidance

- Use Canva boards as reference only, not as application screenshots or background images.
- Implement layout and typography in CSS; use SVG or an icon library for crisp icons.
- Use CSS custom properties for theme tokens so components share consistent colors.
- Prefer border, spacing, and contrast to shadows or glow for hierarchy.
- Keep content widths constrained for readable summaries.
- Render email text as untrusted content; never interpret it as app commands or trusted markup.
- Ensure the local backend API is protected against calls from untrusted origins.
- Do not expose Groq API keys or OAuth tokens to the frontend bundle or client logs.

### Suggested CSS token structure

```css
:root {
  --bg-base: #0D1117;
  --bg-surface: #151B23;
  --bg-elevated: #1D2630;
  --border-subtle: #2B3642;
  --text-primary: #E6EDF3;
  --text-secondary: #9BA8B5;
  --accent: #42D6C5;
  --accent-muted: #173B3A;
  --warning: #E7B567;
  --danger: #F07178;
  --success: #79C99E;
}
```

In production, split theme values into explicit light and dark scopes. Test every token against actual UI components.

## 12. Definition of done for the UI MVP

- [ ] Floating pill renders sharply at Windows display scaling levels tested.
- [ ] Pill can expand, collapse, be repositioned, and recover from off-screen placement.
- [ ] Always-on-top behavior is configurable.
- [ ] Expanded panel supports keyboard interaction and a full-window alternative.
- [ ] Loading, empty, disconnected, error, and completed states are designed.
- [ ] Gmail briefing identifies its scan range and provides source links.
- [ ] Draft state clearly says “Not sent”.
- [ ] No send-email action exists in the MVP.
- [ ] Light and dark themes use the same component hierarchy.
- [ ] Theme colors and spacing use shared design tokens.
- [ ] Sensitive data is not shown in the collapsed pill or diagnostic logs.
- [ ] Long content scrolls within the panel without covering the composer.
- [ ] UI is tested on multiple display scales and at least one multi-monitor setup.
- [ ] Mock data is clearly separated from live integration data during development.

## 13. Current scope and deferred capabilities

**In scope now**
- Floating desktop pill and expanded assistant UI.
- Light and dark themes.
- React/TypeScript UI with Tauri shell.
- Gmail connection, email summaries, and Gmail reply drafts after the UI foundation.
- Groq-backed AI through the local backend.
- Clear activity, permission, loading, and error states.

**Planned later**
- Calendar agenda and event creation with confirmation.
- Google Drive search and document summarization.
- Daily briefing and scheduled workflows.
- Controlled desktop actions.
- Extensible tool/integration architecture.

**Deferred**
- ChatGPT-specific app/MCP integration.
- Autonomous email sending.
- Arbitrary shell command execution.
- Background monitoring while the app/service is not running, until the execution model is designed and tested.

## 14. Recommended implementation sequence

1. Create the Tauri + React shell and prove the floating window behaviors.
2. Implement tokens, light/dark themes, and the shared component library.
3. Build the expanded assistant home, composer, activity states, settings shell, and full-window fallback.
4. Connect the UI to a local Spring Boot health endpoint.
5. Add Gmail OAuth and read-only retrieval.
6. Add the email briefing view with source-grounded summaries.
7. Add draft generation and Gmail Drafts save flow; retain the no-send boundary.
8. Test keyboard use, contrast, display scaling, monitor changes, performance, and error recovery.
9. Add Calendar, Drive, scheduling, and desktop tools only after the Gmail workflow is stable.

## 15. Design references

- Light-theme Canva concept: [Open light-theme concept](https://canva.link/8dqrog6fmmzy7s7)
- Dark-theme Canva concept: [Open dark-theme concept](https://canva.link/aiine44g85k9avg)

These designs are visual references. Fine text and component behavior should be recreated natively for a crisp, responsive application, rather than relying on rasterized mockup assets.

## 16. Final UX recommendation

Make the collapsed pill the product's signature, not its entire interface. It should stay quiet, communicate state at a glance, and expand only when the user needs to interact. Once expanded, the interface should prioritize source-linked information and safe next actions over decorative effects. This produces a subtle, practical desktop assistant and keeps the design straightforward to implement and maintain.
