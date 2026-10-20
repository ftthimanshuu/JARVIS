# JARVIS — UI/UX Implementation Specification

> **Purpose:** Hand this document to an AI coding agent as the UI implementation brief.  
> **Design source of truth:** [JARVIS — Desktop AI Assistant UI in Figma](https://www.figma.com/design/tsB5aTldMwtmqsoA4VGzLu)  
> **Version:** 1.0  
> **Status:** Approved visual direction; implementation specification  
> **Scope:** Independent desktop application. ChatGPT/MCP integration is deferred.

---

## 0. Instructions for the AI coding agent

Implement the JARVIS desktop UI described below and use the linked Figma file as the visual source of truth. Do not redesign, reinterpret, or “improve” the visual direction without being asked.

### Non-negotiable requirements

1. **Match the Figma design.** Keep the compact floating pill, subtle surfaces, clean typography, low-contrast borders, and restrained teal accent.
2. **The pill's status indicator must be a hollow ring, not a filled dot.** Its center must be transparent. Use a circular outline with no fill, approximately 30 × 30 px and 3 px stroke, similar to the classic Windows Cortana ring.
3. Build the interface from **native UI elements**: React components, CSS, text, and vector icons. Never use a screenshot of the Figma board as the application UI.
4. Implement both light and dark themes using the same component hierarchy and dimensions.
5. Keep the UI minimalist and subtle. No neon glow, sci-fi HUD, large gradients, decorative background artwork, or constant pulsing.
6. Do not show real sensitive email content in the collapsed pill.
7. A generated reply must be visibly labelled **“Draft · Not sent”**. Saving a draft is not sending an email.
8. The first release must not send email autonomously. Do not add a send-email action to this UI.
9. ChatGPT-specific integration and MCP are out of scope for this implementation.
10. Use the existing project stack where available: **Tauri + React + TypeScript**, connected to a local **Spring Boot** backend. The UI must remain decoupled from Gmail/Groq business logic.

Before coding, inspect the existing repository and preserve its conventions. If the repository or existing component structure differs from these assumptions, explain the discrepancy and make the smallest compatible change rather than rebuilding the project unnecessarily.

---

## 1. Product intent

JARVIS is a desktop-first personal AI assistant that stays out of the user's way until needed. Its signature interaction is a small floating pill inspired by the interaction pattern of Dynamic Island, adapted for a desktop application.

The experience should feel:

- Minimal and calm.
- Available without demanding attention.
- Fast to read at a glance.
- Clear about status, sources, and pending user actions.
- Trustworthy: distinguish a suggestion from an operation that has actually completed.
- Crisp at different display scales because the UI is rendered from real text and vector elements.

The pill is the entry point, not the entire application. Expanding it reveals the assistant panel. Longer workflows such as reviewing email or configuring integrations can use the panel or a conventional full-window mode.

## 2. Scope and feature boundaries

### In scope for the UI foundation

- Floating pill with hollow Cortana-style status ring.
- Collapsed, working, and approval-needed pill states.
- Expanded assistant home panel.
- Light and dark themes.
- Quick-action chips.
- Activity and operation-status presentation.
- Email briefing screen.
- Reply draft-review screen.
- Connections/settings structure.
- Error, empty, loading, disconnected, and completed states.
- Future Calendar and Drive preview layouts.
- Responsive layout within desktop display boundaries.
- Keyboard access, visible focus states, and reduced-motion behavior.
- Local frontend-to-backend communication.

### Integration sequence

1. UI shell and floating-window behavior.
2. Local Spring Boot health endpoint.
3. Gmail connection and read-only email retrieval.
4. Email briefing and AI summary presentation.
5. Reply draft generation and saving to Gmail Drafts.
6. Calendar and Drive screens when those integrations are implemented.
7. Scheduled briefings and controlled desktop tools in later phases.

### Explicitly out of scope

- ChatGPT-specific app/MCP integration.
- Automatic email sending.
- Arbitrary shell command execution.
- Pretending Calendar or Drive is connected before its integration exists.
- Persistent cloud storage of all the user's messages.
- Voice input unless separately implemented and explicitly enabled.

---

## 3. Design source and Figma frame map

Figma file: [Open the JARVIS UI design](https://www.figma.com/design/tsB5aTldMwtmqsoA4VGzLu)

The canvas is an editable design board containing separate native frames. The dimensions below refer to the design-board frames and their internal layouts; they are reference measurements for visual matching, not universal operating-system window constraints.

| Figma frame | Frame size | Purpose |
|---|---:|---|
| `JARVIS — UI/UX Design Board` | 1760 × 1770 | Design exploration board |
| `Pill • Light • Ready` | 310 × 72 | Light-theme collapsed pill |
| `Pill • Dark • Working` | 310 × 72 | Dark-theme pill during work |
| `Pill • Needs approval` | 310 × 72 | Approval-needed pill state |
| `Screen • Assistant Home • Light` | 510 × 500 | Light-theme expanded assistant |
| `Screen • Assistant Home • Dark` | 510 × 500 | Dark-theme expanded assistant |
| `Screen • Email Briefing • Dark` | 575 × 500 | Priority email summary |
| `Screen • Draft Reply • Dark` | 575 × 650 | Reply review/editor |
| `Preview • Calendar • Light` | 330 × 260 | Future Calendar preview |
| `Preview • Drive Search • Dark` | 330 × 260 | Future Drive preview |
| `State • Ready` and related status rows | 310 × 46 each | Task state references |

The Figma design includes three pill states, both assistant-home themes, an email briefing, a draft-review screen, a compact task-state list, and preliminary Calendar/Drive views.

### Geometry guidance

Use the Figma frames to preserve visual proportions. Initial implementation targets:

- Collapsed pill: approximately **310 × 72 logical Figma units** in the reference board. In the actual desktop application it may be reduced slightly after testing, but must keep its current proportions and legibility.
- Expanded assistant home: approximately **510 × 500** in the reference design.
- Email briefing: approximately **575 × 500**.
- Reply draft review: approximately **575 × 650**.
- Calendar/Drive previews: approximately **330 × 260**.

The actual application must respect the usable screen area, Windows scaling, taskbar placement, and multiple monitors. Do not hard-code window placement so it can move off-screen.

---

## 4. Visual system

### 4.1 Typography

The current Figma frames use **Inter**. Use Inter in the application if licensing and packaging are appropriate for the project; otherwise choose and document a metrically similar fallback. Do not silently switch to a decorative or display typeface.

| Role | Target size | Weight | Usage |
|---|---:|---|---|
| Main greeting | 23 px | Semi Bold | Assistant home |
| Screen heading | 17 px | Semi Bold | Email briefing and draft review |
| Brand wordmark | 15 px | Semi Bold | Pill and header |
| Email sender | 13 px | Semi Bold | Email card |
| Main body / subject | 12 px | Regular or Medium | Message content |
| Supporting copy | 11 px | Regular | Summaries and context |
| Metadata / compact label | 10 px | Medium or Semi Bold | Categories, status, timestamps |
| Small utility text | 9 px | Regular | Token board/reference labels |

These match the relative scale in the current Figma frames. Adjust only where necessary for accessibility, localization, or platform rendering; preserve hierarchy.

### 4.2 Dark theme color tokens

Use these as CSS custom properties. Do not scatter independent hex values across components.

| Token | Value | Intended use |
|---|---|---|
| `--color-bg-base` | `#0D1117` | Deep inner editor/background surface |
| `--color-surface` | `#151B23` | Main dark app/panel surface |
| `--color-surface-raised` | `#1D2630` | Chips, fields, email cards |
| `--color-border` | `#2B3642` | Outlines and separators |
| `--color-text-primary` | `#E6EDF3` | Main text |
| `--color-text-muted` | `#9BA8B5` | Secondary text and metadata |
| `--color-accent` | `#42D6C5` | Accent ring, primary action, focus |
| `--color-accent-soft` | `#173B3A` | Selected/attention surface |
| `--color-warning` | `#E7B567` | Approval-needed state and priority labels |
| `--color-danger` | `#F07178` | Failure state |
| `--color-success` | `#79C99E` | Completed state |

Suggested CSS:

```css
[data-theme="dark"] {
  color-scheme: dark;
  --color-bg-base: #0D1117;
  --color-surface: #151B23;
  --color-surface-raised: #1D2630;
  --color-border: #2B3642;
  --color-text-primary: #E6EDF3;
  --color-text-muted: #9BA8B5;
  --color-accent: #42D6C5;
  --color-accent-soft: #173B3A;
  --color-warning: #E7B567;
  --color-danger: #F07178;
  --color-success: #79C99E;
}
```

### 4.3 Light theme color tokens

| Token | Value | Intended use |
|---|---|---|
| `--color-bg-base` | `#F7F8FA` | Outer/light background |
| `--color-surface` | `#FFFFFF` | Main panel and cards |
| `--color-surface-raised` | `#F0F3F5` | Chips and input surface |
| `--color-border` | `#DCE3E8` | Outlines and separators |
| `--color-text-primary` | `#17212B` | Main text |
| `--color-text-muted` | `#5F6E79` | Supporting text |
| `--color-accent` | `#087F78` | Accent and primary action |
| `--color-accent-soft` | `#DFF4F0` | Selected/soft accent surface |

```css
[data-theme="light"] {
  color-scheme: light;
  --color-bg-base: #F7F8FA;
  --color-surface: #FFFFFF;
  --color-surface-raised: #F0F3F5;
  --color-border: #DCE3E8;
  --color-text-primary: #17212B;
  --color-text-muted: #5F6E79;
  --color-accent: #087F78;
  --color-accent-soft: #DFF4F0;
  --color-warning: #B87518;
  --color-danger: #B93640;
  --color-success: #247A4A;
}
```

The light-theme warning, danger, and success tokens may use darker equivalents to remain legible on light surfaces. Preserve their meaning and visual subtlety.

### 4.4 Spacing and corner geometry

- Base spacing grid: 4 px.
- Common gaps/padding: 4, 8, 12, 16, 20, 24 px.
- Floating pill: full-radius capsule, radius 36 px at the reference frame size.
- Main panels: 16 px radius.
- Email cards: 12 px radius.
- Inputs and action buttons: 8–13 px radius.
- Quick-action chips: 17 px radius at 34 px height.
- Borders: 1 px, generally subtle.
- Elevation: restrained shadow only where necessary to distinguish the floating window from the desktop; avoid dramatic glow.
- Keep icon strokes consistent and minimal. Prefer an installed icon library or native SVGs; do not construct icons from piles of primitive shapes.

### 4.5 Theme behavior

Offer `System`, `Light`, and `Dark` preferences. Both themes must use the same spacing, layout, type scale, states, and information hierarchy. Store the preference locally. If System is selected, respond to the operating-system theme.

---

## 5. Floating pill — highest-priority component

### 5.1 Visual construction

Reference frame: 310 × 72.

- Shape: rounded capsule.
- Light surface: `#FFFFFF`; outline `#DCE3E8`.
- Dark surface: `#151B23`; outline `#2B3642`.
- Border radius: 36 px.
- Status ring: 30 × 30, approximately 3 px circular stroke, transparent center, no fill.
- Ring placement in the reference frame: x ≈ 18, y ≈ 21.
- Wordmark: `JARVIS`, 15 px Semi Bold; x ≈ 62, y ≈ 16.
- State label: 11 px; x ≈ 62, y ≈ 39.
- Right affordance: a small, subtle 8 × 8 px marker near x ≈ 276, y ≈ 32 in the current reference.

**Critical:** The status ring is a hollow circle, not a filled circle. The desktop surface must be visible through its center. Do not replace it with a solid status dot. Render it with a circular SVG/CSS border or an ellipse with `fill: none`, not an image.

Example SVG for the ring:

```svg
<svg viewBox="0 0 30 30" width="30" height="30" aria-hidden="true">
  <circle
    cx="15"
    cy="15"
    r="12"
    fill="none"
    stroke="currentColor"
    stroke-width="3"
  />
</svg>
```

Set the stroke color through the relevant state token. Keep the center fully transparent.

### 5.2 Pill states and color

| State | Text | Ring | Behavior |
|---|---|---|---|
| Ready / idle (light) | `Ready` | `#087F78` | Quiet, no animation |
| Working (dark) | `Working` | `#42D6C5` | Gentle, brief activity treatment; no constant glow |
| Needs approval | `Needs approval` | `#E7B567` | Explicit attention state |
| Completed | Brief completion state | `#79C99E` in dark mode | May appear briefly, then return to Ready |
| Error/disconnected | Clear recovery label after expansion | `#F07178` | Provide retry or reconnect path |
| Listening (future) | Clearly labelled listening state | Accessible, visibly distinct state | Only if voice is explicitly implemented |

The Figma board includes filled status dots in the **task-state list and connection indicators**; those are separate components. The **pill status indicator specifically must remain hollow**.

### 5.3 Pill interaction

- Click, Enter, or Space expands the assistant.
- Provide a keyboard shortcut to show/hide the panel if supported by the desktop shell.
- The pill can be repositioned from a defined drag region; dragging must not prevent normal clicks.
- Always-on-top must be configurable.
- Keep the pill within the active monitor's usable work area.
- Remember the position when practical. If a display is disconnected and the window would be off-screen, restore it to a visible position.
- Do not show email sender names, subjects, message snippets, or other sensitive content in the collapsed state.
- The pill should not steal focus while the user is typing in another application.

---

## 6. Expanded assistant home

Reference frame: 510 × 500.

### 6.1 Container and header

- Light surface: `#FFFFFF`; border `#DCE3E8`.
- Dark surface: `#151B23`; border `#2B3642`.
- Corner radius: 16 px.
- Header divider around y = 62 px.
- Wordmark `JARVIS` at x ≈ 22, y ≈ 17; 15 px Semi Bold.
- Connection indicator: small 8 × 8 dot.
- Text `Gmail connected` beside the dot, approximately 10 px.
- Use the theme accent for the connection dot and muted text for the connection label.
- Keep controls visually quiet. Window controls and settings access must remain accessible without crowding the header.

### 6.2 Greeting and quick actions

Greeting:
- Text: `How can I help?`
- Approx. 23 px Semi Bold.
- Reference position: x ≈ 22, y ≈ 84.

Supporting line:
- Text: `Your workspace, summarized.`
- Approx. 13 px.
- Use secondary text color.

Quick actions:
- `Summarize emails`
- `Draft a reply`
- `Today's agenda`

Reference chip construction:
- Height: 34 px.
- Fully rounded ends / radius about 17 px.
- Background: raised surface.
- Border: subtle.
- Small 10 × 10 px accent dot at left, then label.
- Do not make every chip look like a large primary button.

The current design includes Today's agenda as a visual quick action. Until Calendar is actually implemented, either render it as a clearly marked future/disabled capability or hide it behind feature availability. Do not make a dead control look operational.

### 6.3 Recent activity

- Section label: `RECENT ACTIVITY`, approx. 10 px Semi Bold, accent color.
- Activity icon tile: 34 × 34 px with 9 px radius and soft accent background.
- Activity title: `Daily summary ready`, 13 px Medium.
- Supporting line: `8 emails reviewed · 2 need attention`, 11 px muted.
- Use live data once integrated. Fixture/sample content is for mockups and development only.
- If there is no activity, show a restrained empty state or omit the section rather than fabricate activity.

### 6.4 Composer

- Anchored near the bottom of the panel.
- Reference size: approximately 474 × 54 px.
- Background: raised surface.
- Border: subtle.
- Corner radius: 13 px.
- Placeholder: `Ask JARVIS…`, 13 px muted.
- Send button: approx. 34 × 34 px with 10 px radius, accent fill.
- Use a crisp upward arrow or the matching icon from the project's icon library.
- Enter sends; Shift+Enter inserts a new line if multiline input is supported.
- During a request, change the send control to a clear stop/cancel affordance if cancellation is supported.
- Keep the composer visible while content above it scrolls.

### 6.5 Assistant home states

Implement:
- First-launch state with `Connect Gmail`.
- Gmail connected state.
- Working state with a task description.
- Empty activity state.
- Recoverable error state.
- Needs approval state.
- Completed state.

Never show an integration as connected unless the backend confirms it.

---

## 7. Email briefing screen

Reference frame: 575 × 500, dark theme in current design.

### 7.1 Header

- Background: `#151B23`.
- Border: `#2B3642`.
- Corner radius: 16 px.
- Header divider around y = 62 px.
- Heading: `Email briefing`, 17 px Semi Bold.
- Period: `Today · Last 24 hours`, 11 px muted.
- Attention badge: approx. 153 × 29 px, radius 15 px, background `#173B3A`, accent text `2 need attention`.
- Section label `PRIORITY`, 10 px Semi Bold, accent color.

The period must reflect the actual query range; it must not always say “Last 24 hours” if the user requested a different range.

### 7.2 Email card

Reference card dimensions: approximately 539 × 168 px, with 12 px radius.

- Card background: `#1D2630`.
- Border: `#2B3642`.
- Padding: approximately 14 px.
- Category: 10 px Semi Bold, warning color for action-needed examples.
- Sender: 13 px Semi Bold.
- Subject: 12 px Medium.
- Summary: 11 px muted.
- Date/source detail: 10 px muted.
- Secondary source/open button: approx. 105 × 26 px, dark surface, 7 px radius, subtle border.
- Optional `Draft reply` action: approx. 102 × 26 px, teal accent fill with dark text.

Example content used in the Figma concept:
- Category: `RECRUITER · REPLY NEEDED`
- Sender: `Hiring Team`
- Subject: `Technical interview availability`
- Summary: `The sender requests confirmation of your availability.`
- Detail: `Date mentioned: 22 Oct · verify in source`

Second example:
- Category: `COLLEGE NOTICE · ACTION REQUIRED`
- Sender: `College Administration`
- Subject: `Internal assessment timetable`
- Summary: `An updated timetable has been shared for the semester.`
- Detail: `Open the notice to confirm the schedule`

These are sample data, not real messages. Replace with live email data after integration.

### 7.3 Content and actions

Every summary should make it easy to verify source facts:
- Keep sender, subject, timestamp/date and source link visible.
- Open the original Gmail message from `Open email`.
- `Draft reply` opens the draft-review flow for that specific message.
- Dates inferred from message text must be labelled as “Date mentioned” if not verified.
- Do not convert extracted dates into calendar events automatically.
- Never allow email contents to override the application's tool/permission policy.

The email briefing should support:
- Loading state (`Searching Gmail…`, then `Summarizing messages…`).
- Empty state: `No important emails found in this period.`
- Disconnected state with `Reconnect Gmail`.
- Error state with `Try again`.
- A lower-priority/other-messages section when there are results.

---

## 8. Reply draft-review screen

Reference frame: 575 × 650, dark theme.

### 8.1 Layout and hierarchy

- Main surface: `#151B23`.
- Border: `#2B3642`.
- Radius: 16 px.
- Header divider around y = 62 px.
- Heading: `Draft reply`, approx. 17 px Semi Bold.
- Badge: `Draft · Not sent`, approx. 128 × 28 px, radius 14 px, subtle warm background `#30251A`, text `#E7B567`.
- To/recipient field and subject field are separated and easy to read.
- Field surface: `#1D2630`.
- Field border: `#2B3642`.
- Field radius: 8 px.
- Draft body/editor surface: `#0D1117`, subtle border, radius 9 px.
- Buttons remain minimal and aligned to the bottom area.

### 8.2 Content and controls

The Figma example uses:
- Recipient: `recruiter@example.com`
- Subject: `Re: Technical interview invitation`
- Body beginning: `Dear Hiring Team,`
- Body text thanking the hiring team and asking whether any materials should be prepared.
- Sign-off: `Best regards,` and a sample name.

All email content is illustrative. The real application must derive recipient, subject, and source context from the selected message and must not hard-code personal information into production.

Controls:
- `View source email` — open the original Gmail message.
- `Regenerate` — request a new draft with the same source context and instructions.
- `Save to Gmail Drafts` — explicit primary action after the user reviews the response.

Rules:
- Show `Draft · Not sent` until draft creation is confirmed.
- After saving, show a confirmation such as `Draft saved to Gmail`.
- Do not display a “Sent” state.
- Do not add a Send button to the MVP.
- Preserve user edits if the user navigates away or collapses the panel; warn before discarding unsaved changes.
- Validate recipient and subject before saving.
- If the AI draft makes a factual claim that is not in the source context or user-provided instructions, make it editable and do not represent it as verified.

---

## 9. Task status and future screens

### 9.1 Task-status rows

The Figma board includes a compact status list with a small filled status marker. These are not the pill's ring.

Recommended statuses:
- `Ready` / `Idle` — accent.
- `Working` / `Searching Gmail` — accent.
- `Approval` / `Needs approval` — warning.
- `Complete` / `Task completed` — success.
- `Error` / `Reconnect Gmail` — danger.

A status must be communicated by text or icon as well as color.

### 9.2 Future Calendar preview

Reference size: 330 × 260, light theme.
- Heading: `Today's agenda`.
- Supporting line: `Times shown in local time`.
- Three compact rows with time and event title.
- Small vertical color markers distinguish the items.
- Avoid heavy gridlines or a dense full-calendar layout in the compact preview.

This is a future screen, not proof that Calendar integration is implemented. Event creation must require review/confirmation and correct timezone handling.

### 9.3 Future Drive preview

Reference size: 330 × 260, dark theme.
- Heading: `Search Drive`.
- Search field with muted placeholder `Search files…`.
- Three compact file rows.
- Small file-type tile, filename, and muted metadata.
- Preserve the concise density shown in the Figma preview.

The Figma example names (`Himanshu_Resume.pdf`, `Placement_Prep.docx`, `Spring_Boot_Notes.pdf`) are placeholders and must never be assumed to exist in a user's Drive. Use actual authorized results or obvious demo fixtures.

---

## 10. Interaction and motion specification

- Expand/collapse should feel direct and subtle. Suggested duration: 140–220 ms with an ease-out curve.
- Respect reduced-motion preference; no necessary information should depend on animation.
- Avoid constant pulsing, glow, breathing effects, or decorative movement.
- Hover and focus states must be visible but quiet.
- Do not steal focus when the user clicks into another application.
- Closing the panel and quitting the background app must be distinct actions.
- Always-on-top should be optional.
- A long-running operation should show the current stage, not a fake percentage.
- Provide Cancel where safe and supported.
- Clicking outside may collapse the panel, but must not silently discard the draft or terminate an operation.
- If the assistant runs in a tray/background mode, make the state and exit controls discoverable.
- The UI must recover if the user's monitor layout changes and the previous pill position is no longer visible.

---

## 11. Component architecture for React

Use small, named components. Separate presentation from service/API logic.

Suggested tree:

```text
src/
  app/
    App.tsx
    routes.tsx                 # if routing is needed
  components/
    floating/
      FloatingPill.tsx
      StatusRing.tsx           # hollow SVG ring; never a filled dot
      FloatingWindow.tsx
    assistant/
      AssistantHome.tsx
      AssistantHeader.tsx
      QuickActionChip.tsx
      CommandComposer.tsx
      ActivityItem.tsx
      TaskProgress.tsx
    email/
      EmailBriefing.tsx
      EmailSummaryCard.tsx
      PriorityBadge.tsx
      ReplyDraftReview.tsx
      SourceLink.tsx
    future/
      CalendarPreview.tsx
      DriveSearchPreview.tsx
    settings/
      SettingsView.tsx
      ConnectionCard.tsx
      ThemeSelector.tsx
    feedback/
      EmptyState.tsx
      ErrorState.tsx
      Toast.tsx
  styles/
    tokens.css
    themes.css
    global.css
  services/
    backendClient.ts
  types/
    api.ts
    tasks.ts
```

If the repository already has a suitable structure, adapt this map rather than forcing a duplicate structure.

### 11.1 StatusRing component

Implement as an SVG circle with `fill="none"` and a state-derived stroke. Suggested props:

```ts
type StatusRingState = "ready" | "working" | "needs-approval" | "complete" | "error";

type StatusRingProps = {
  state: StatusRingState;
  size?: number;       // default 30
  strokeWidth?: number; // default 3
  className?: string;
};
```

The ring's inner center must remain transparent. The stroke must be crisp at 100%, 125%, 150%, and 200% Windows display scaling. Use vector SVG rather than a raster image.

### 11.2 API separation

- React components must not call Gmail or Groq directly.
- Use one typed client module for local Spring Boot API calls.
- Represent loading/error/success from real API responses.
- Use clear placeholder/demo fixtures during UI work; separate them from production paths.
- Do not place Groq API keys, refresh tokens, or OAuth secrets in frontend source, browser storage, or logs.

---

## 12. UI state model

Prefer one explicit status per operation rather than conflicting booleans.

```ts
type OperationStatus =
  | "idle"
  | "queued"
  | "running"
  | "needs_approval"
  | "completed"
  | "failed"
  | "canceled";
```

Each operation may carry:
- `id`
- `title`
- `integration`
- `status`
- `startedAt`
- `completedAt`
- `sourceUrl`
- `resultSummary`
- `userFacingError`

Do not store message bodies in local activity history by default. Do not put email content, API keys, or authorization tokens in diagnostic logs.

Theme preference:

```ts
type ThemePreference = "system" | "light" | "dark";
```

Persist locally. Use the same component tree for both themes.

---

## 13. Accessibility, privacy, and errors

### Accessibility
- Support keyboard navigation and visible focus indicators.
- Icon-only buttons must have accessible names.
- Don't rely on color alone for status.
- Text and controls must retain adequate contrast in both themes.
- Avoid using hover as the only way to reveal an action.
- Keep click targets comfortable, especially for close, expand, send/request, and approval controls.
- Support reduced motion.
- Provide a full-window alternative to the floating surface.

### Privacy
- The collapsed pill must not expose message text or personal details.
- Explain connection permissions and allow users to disconnect Google services.
- Keep secrets in a secure storage mechanism when feasible.
- Avoid retaining email bodies unless a feature requires them and the user understands why.
- Treat retrieved email/document text as untrusted data, not instructions for the agent.

### Error copy examples
- `Gmail disconnected — reconnect to continue.`
- `Couldn't retrieve emails. Check your connection and try again.`
- `Groq request limit reached. Try again later or select another configured model.`
- `Draft wasn't saved. Your text is still here; try again.`

Never show stack traces, tokens, or raw authorization data in the UI.

---

## 14. Acceptance checklist

The implementation is ready for review only when all applicable items pass.

### Visual fidelity
- [ ] Pill dimensions, proportions, and alignment match Figma.
- [ ] **Pill status ring is hollow, no fill, with a visible circular stroke.**
- [ ] Pill ring colors match the state and theme.
- [ ] Assistant light and dark panels match the Figma layout and hierarchy.
- [ ] Email briefing and draft review match the Figma proportions, typography, and surfaces.
- [ ] Borders, radii, and spacing use shared design tokens.
- [ ] Interface is built from native UI layers; no complete-screen raster image is used.
- [ ] Text remains crisp at Windows 100%, 125%, 150%, and 200% scaling where testable.

### Behavior
- [ ] Pill expands/collapses by mouse and keyboard.
- [ ] Pill can be repositioned and restored if off-screen.
- [ ] Always-on-top is configurable.
- [ ] Theme can be System/Light/Dark.
- [ ] Composer stays visible while the content scrolls.
- [ ] Loading, empty, disconnected, failure, and completed states exist.
- [ ] Reply editor clearly states `Draft · Not sent`.
- [ ] Saving a draft is distinct from sending it.
- [ ] No autonomous send-email feature exists in MVP.
- [ ] Calendar/Drive controls do not pretend to work before those integrations exist.

### Engineering
- [ ] Components are reusable and appropriately separated.
- [ ] UI uses a typed local-backend API client.
- [ ] Secret values are not included in the frontend bundle or logs.
- [ ] Sample email/file content is separated from production data.
- [ ] Keyboard/focus/reduced-motion behavior is checked.
- [ ] The packaged Tauri app manages its local backend reliably.

---

## 15. Recommended implementation sequence

1. Inspect the repository and verify Tauri, React, TypeScript, and Spring Boot setup.
2. Implement design tokens and the shared light/dark theme.
3. Implement `StatusRing` first and confirm it is hollow in the rendered UI.
4. Build the floating pill and test drag, expand/collapse, always-on-top, display bounds, and keyboard behavior.
5. Build the expanded assistant home in both themes with quick actions, activity and composer.
6. Connect the UI to a local Spring Boot health endpoint.
7. Build the email briefing using explicit demo fixtures first, then connect authorized Gmail data.
8. Build the reply-review flow and connect saving to Gmail Drafts only.
9. Add empty/error/loading/disconnected states.
10. Refine spacing and scale against the Figma frames; capture screenshots and compare at 100% size.
11. Add Calendar/Drive only in later milestones.
12. Run accessibility, multi-monitor, and display-scaling checks.

## 16. Required visual review

Before declaring the task complete, the AI agent should:
1. Run the application.
2. Capture screenshots of the floating pill, assistant home in light and dark themes, email briefing, and draft review.
3. Compare the screenshots with the linked Figma file.
4. Fix actual visual mismatches rather than making broad aesthetic changes.
5. Confirm specifically that the pill's ring has a hollow center and a 3 px outline.
6. Report remaining differences honestly.

## 17. Final direction

Implement the design as shown: a quiet floating capsule, a **hollow Cortana-style ring**, compact assistant surfaces, subtle separators, readable text, and restrained teal accents. The core UI should feel like a native desktop companion rather than a conventional full-screen dashboard or a futuristic HUD.

Figma is the visual reference; this document defines behavior, implementation boundaries, and acceptance criteria. When in doubt, preserve the current design rather than introducing a new visual style.
