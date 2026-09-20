# Requirements: Planner Personalization, Routine Streaks, and Upcoming Schedule

**Status:** Approved on September 20, 2026. All eight decisions in Section 7 were approved without changes.

## 1. Product intent

Daycraft shall become a calm, mobile-first routine planner that answers three questions without making the user configure or interpret a complex productivity system:

1. **What should I do now?**
2. **What is coming next?**
3. **Am I consistently following the routine I chose?**

Customization shall support those questions rather than compete with them. Categories are organization and visual recognition; routines are reusable weekly plans; blocks are time-bounded actions; habits are the small completion items used to track adherence. These concepts must not be presented as interchangeable.

This spec replaces the product assumptions in `.kiro/specs/daily-routine-dashboard/design.md`. That document describes an obsolete in-memory, Monday-only prototype with the retired Faith category and old indigo visual system. It remains historical documentation and shall not guide implementation of this feature.

## 2. Reference-product research

The research is intentionally pattern-oriented: Daycraft should learn from proven behavior without copying another product's visual identity.

| Product | Useful pattern | Daycraft interpretation | Pattern not copied |
|---|---|---|---|
| [Structured](https://www.structured.app/blog/4-0) | Day/week/month timeline views and quick movement between settings and the timeline | A stable seven-day strip with a linear daily timeline; edits return users to the place they came from | Dense bottom navigation and platform-specific gestures |
| [Structured accessibility guidance](https://structured.app/blog/neurodivergent-month) | A clean linear day reduces planning noise | One dominant path: Now → Next → Today, with secondary controls progressively disclosed | Adding more dashboard widgets merely because competitors have them |
| [Routinery](https://www.routinery.app/) | Guided focus on one routine step at a time, with the ability to skip | Make current/upcoming actions prominent and let users recover from real-life changes without shame | Voice coaching and mandatory step timers |
| [Sunsama daily planning](https://help.sunsama.com/docs/usage-guides/daily-planning/) | Ordered tasks and optional timeboxing | Keep schedule order clear and make time a property of a block, not a separate complex calendar editor | Integrations and professional-work planning rituals |
| [TickTick calendar](https://blog.ticktick.com/2020/10/30/ticktick-premium-101/) | Multiple date ranges and a unified view of tasks, events, and habits | Offer Today and a lightweight seven-day horizon using one canonical occurrence feed | Five competing calendar modes |
| [TickTick filters](https://todoist.com/help/articles/205248842) | Narrowing a large list by useful criteria | Category filters remain secondary and contextual; they do not replace routine/date navigation | Query syntax and unlimited custom-filter complexity |
| [Todoist mobile capture](http://hi.todoist.com/inspiration/todoist-ambassadors-tips) | Fast add from one entry point with details available progressively | One obvious Add action; basic block fields first, advanced category/color options below | Natural-language parsing in this phase |
| [Habitify](https://habitify.me/new-home) | Progress is explained with recent history and trends, not only a streak number | Pair streak count with a seven-day status strip and compassionate recovery copy | Competitive gamification, public rankings, or punishment |
| [Habitify upcoming dates](https://feedback.habitify.me/en/changelog/habitify-android-3200-a-smoother-smarter-experience-on-android) | Show generated future dates for interval schedules | Upcoming blocks must include an explicit date/routine so users know when the next occurrence actually happens | Opaque recurrence rules |

**Research conclusion:** The strongest shared pattern is not “more features.” It is a single daily focus surface, a short future horizon, low-friction capture, and progress that remains understandable after plans change. Daycraft's unique expression shall be its warm cream canvas, soft user-controlled accent colors, hand-drawn display voice, category-tinted timeline cards, and non-punitive “keep your rhythm” language.

Content from the linked sources was rephrased for compliance with licensing restrictions.

## 3. Product vocabulary and boundaries

- **Routine:** A reusable weekly template assigned to one or more weekdays. Example: “Weekday mornings.”
- **Routine occurrence:** One dated instance of a routine. Example: “Weekday mornings on Monday, 21 September.”
- **Schedule block:** A timed action within a routine. Example: “Exercise, 09:00–10:00.”
- **Habit:** A checkable item belonging to a routine. Habits—not elapsed clock time—determine routine adherence.
- **Category:** An account-level organizational label with a name, color, and icon. It groups and filters blocks but does not determine scheduling or streaks.
- **Block color override:** An optional color attached to one block. It changes presentation only; the block remains in its category.
- **Streak:** Consecutive scheduled routine occurrences completed according to the rules in Requirement 4.

## 4. Functional requirements

### Requirement 1 — Mobile-first information architecture

**User story:** As a returning user, I want to understand today and act within seconds, so that the app helps rather than becomes another system to manage.

#### Acceptance criteria

1. WHEN the authenticated dashboard loads on a phone, THE SYSTEM SHALL present content in this order: compact date/header, seven-day selector, current/next focus card, routine progress/streak summary, schedule, habits, then secondary settings.
2. THE SYSTEM SHALL provide exactly one visually dominant Add action on the daily dashboard.
3. WHEN the user taps Add, THE SYSTEM SHALL open a bottom sheet on mobile and a centered modal on larger screens.
4. THE initial Add surface SHALL request only description, start time, and end time; category and custom color SHALL appear under an optional “Personalize” disclosure.
5. THE SYSTEM SHALL keep all primary touch targets at least 44×44 CSS pixels.
6. THE SYSTEM SHALL preserve a 16px minimum mobile page gutter and SHALL NOT create document-level horizontal overflow.
7. THE SYSTEM SHALL avoid simultaneous/nested dialogs and SHALL return focus to the triggering control after a sheet closes.
8. THE dashboard SHALL not expose edit mode, hidden hover-only actions, or unlabeled icon-only controls for core tasks.
9. THE profile/avatar area SHALL remain account-only; routine/category controls SHALL not appear beside the avatar.
10. WHEN data is loading, THE SYSTEM SHALL preserve layout with purpose-built skeletons and SHALL not show misleading zero counts.

### Requirement 2 — Coherent routine navigation

**User story:** As a user with several weekly plans, I want to know which routine and date I am viewing and switch intentionally.

#### Acceptance criteria

1. THE SYSTEM SHALL distinguish date navigation from routine selection: the seven-day strip changes date; the routine context control changes among routines scheduled or available for that date.
2. WHEN a date has one scheduled routine, THE SYSTEM SHALL select it automatically and show its name without requiring another tap.
3. WHEN a date has multiple routines, THE SYSTEM SHALL show the first scheduled routine and a clear count/selector for the others.
4. WHEN a date has no routine, THE SYSTEM SHALL show one focused empty state with actions to assign an existing routine or create one.
5. Routine switching, creation, renaming, recoloring, weekday assignment, and archive/delete SHALL remain available through one “Your routines” sheet.
6. THE SYSTEM SHALL use “routine,” “block,” “habit,” and “category” consistently in all interface copy.
7. Routine controls SHALL not be represented as category chips, and category controls SHALL not be used for switching routines.

### Requirement 3 — User-managed categories

**User story:** As a user, I want categories that match my life, so that the planner is personal without becoming hard to scan.

#### Acceptance criteria

1. THE SYSTEM SHALL create five account-level default categories for each account: Career, Health, Language, Life, and Rest.
2. THE SYSTEM SHALL allow a user to create additional categories with a unique account-scoped name, color, and icon from a controlled icon catalog.
3. THE SYSTEM SHALL allow editing category name, color, icon, and display order.
4. THE SYSTEM SHALL limit an account to **20 active categories** to preserve picker and filter usability; archived categories SHALL not count toward the limit.
5. WHEN a category is used by a block, deleting it SHALL archive it rather than destroy it or orphan historical data.
6. WHEN archiving a used category, THE SYSTEM SHALL explain how many blocks use it and offer: archive while preserving existing blocks, or move those blocks to another active category.
7. WHEN a category name matches another active category case-insensitively, THE SYSTEM SHALL reject it with a field-level message.
8. Category creation SHALL be available inline from the block editor through “Create category,” and full management SHALL be available from Planning Preferences/Profile.
9. THE category picker SHALL show recent/used categories first, then the remaining active categories, with search after eight active categories.
10. The daily category filter SHALL show only categories present in the viewed schedule plus “All”; it SHALL not show rows of zero-count categories.
11. WHEN fewer than two categories are present, THE category filter SHALL be hidden because it offers no useful choice.
12. Category filters SHALL remain horizontally scrollable on mobile, with no wrapping into multiple navigation rows.
13. Retired Faith values and unknown legacy values SHALL remain readable but SHALL not become selectable for new blocks.
14. Category mutations SHALL update all affected schedule views without a full page reload.

### Requirement 4 — Routine completion and streaks

**User story:** As a user building consistency, I want an honest, encouraging view of my routine streak, so that progress motivates me without punishing unscheduled days.

#### Acceptance criteria

1. A routine occurrence SHALL be eligible for tracking only when the routine contains at least one active habit for that occurrence.
2. A routine occurrence SHALL be complete when every habit snapshotted for that occurrence is checked.
3. Schedule blocks SHALL NOT be implicitly marked complete merely because time passed.
4. A routine with no habits SHALL show “Add a habit to start tracking this routine” and SHALL not display a zero streak.
5. Unscheduled dates SHALL neither extend nor break a streak.
6. Today SHALL not break a streak while the local day is still in progress.
7. A past scheduled occurrence that was not completed SHALL break the current streak.
8. THE SYSTEM SHALL persist immutable dated routine occurrences and habit snapshots so later edits/deletes do not rewrite historical streak results.
9. Historical checklist logs created before rollout MAY be shown as “earlier activity,” but SHALL NOT be presented as an authoritative streak when requirements cannot be reconstructed.
10. THE dashboard SHALL show current streak, best streak, today’s completed/total habits, and a seven-occurrence status strip.
11. Streak presentation SHALL use encouraging, factual language and SHALL NOT use punishment, public rankings, loss animations, or manipulative notifications.
12. WHEN the user completes the final habit for today, THE SYSTEM SHALL update progress optimistically, confirm persistence, and show one brief reduced-motion-safe celebration.
13. WHEN persistence fails, THE SYSTEM SHALL restore the server state and give a specific retry action.
14. Routine deletion SHALL preserve historical aggregate completion records without retaining user-visible deleted habit content longer than necessary.

### Requirement 5 — Per-block custom colors

**User story:** As a user, I want an individual block to stand out without creating a fake category solely for color.

#### Acceptance criteria

1. Every block SHALL inherit its category color by default.
2. The block editor SHALL provide an optional “Use a custom block color” control under Personalize.
3. WHEN enabled, THE SYSTEM SHALL offer the existing brand presets, a native color wheel, and a hex field.
4. THE SYSTEM SHALL normalize three- or six-digit input to uppercase `#RRGGBB` before sending it to the API.
5. Invalid color input SHALL remain local, show a field-level message on blur/submit, and SHALL NOT be sent to the API.
6. The effective block color SHALL be `color_override ?? category.color` and SHALL be computed consistently for timeline card, current/upcoming card, details sheet, and reminders.
7. Changing a block color SHALL NOT change its category or filter membership.
8. THE SYSTEM SHALL compute readable foreground colors for arbitrary custom colors using contrast-aware helpers.
9. The editor SHALL provide a one-tap “Use category color” reset.

### Requirement 6 — Current and upcoming schedule

**User story:** As a user, I want to see what is happening and what is next across day boundaries, so that I do not miss the next scheduled block.

#### Acceptance criteria

1. THE SYSTEM SHALL persist the user’s IANA timezone and use it for schedule occurrence dates, streak boundaries, and upcoming calculations.
2. THE backend SHALL resolve schedule templates into dated occurrences with absolute `starts_at` and `ends_at` timestamps.
3. THE occurrence resolver SHALL include the previous local date when determining an overnight block that is still active after midnight.
4. THE backend SHALL globally sort occurrences by actual start timestamp, independent of insertion order or routine order.
5. THE dashboard SHALL show at most one primary current/next focus card and a compact list of the next three occurrences within seven days.
6. Each upcoming item SHALL show day/date when not today, time range, routine name, block description, and effective color.
7. WHEN no block occurs within seven days, THE SYSTEM SHALL show “No upcoming blocks in the next 7 days” with an Add/assign action.
8. Now card, upcoming list, browser reminders, and assistant proactive messages SHALL consume the same canonical occurrence feed.
9. WHEN blocks overlap, THE SYSTEM SHALL show all currently active occurrences in the data model and SHALL choose the earliest-ending occurrence as the primary focus card, with a visible “+N also active” affordance.
10. The current/next calculation SHALL NOT use modulo-24-hour wrapping on undated schedule templates.

### Requirement 7 — Category and schedule visual language

**User story:** As a user, I want color and hierarchy to help me scan the day rather than decorate it randomly.

#### Acceptance criteria

1. Schedule cards SHALL use a clearly visible, soft tint of their effective color; fixed black/white/taupe rotation SHALL not determine card identity.
2. Color strength SHALL remain visibly distinguishable on the cream canvas while meeting WCAG AA contrast for text and controls.
3. The block description SHALL be the card headline; category, time range, duration, routine, and status SHALL be supporting information.
4. “Now,” “Next,” “Completed,” and error states SHALL use semantic labels in addition to color.
5. Empty states SHALL contain one explanation and no more than two actions.
6. The script display type SHALL be reserved for product voice and high-level status, while forms and dense data SHALL use the sans-serif family.
7. Repeated actions SHALL use the same label and visual treatment across dashboard, detail sheet, and editors.
8. Every animation SHALL honor `prefers-reduced-motion` and SHALL not block interaction.
9. Category and custom colors SHALL be user data; static Tailwind category tokens MAY remain only as semantic/default seed tokens during migration.

### Requirement 8 — Fast, resilient interactions

**User story:** As a mobile user, I want creating, editing, checking, and deleting to feel immediate even on an imperfect connection.

#### Acceptance criteria

1. A control SHALL provide visual press/loading feedback within 100ms of interaction.
2. Mutating actions SHALL prevent duplicate submission while in flight.
3. Habit toggles and non-destructive edits SHALL update optimistically and reconcile with the server response.
4. Destructive operations SHALL wait for server confirmation before removing data from the durable UI state.
5. THE SYSTEM SHALL use one coherent dashboard/bootstrap response or coordinated cache to avoid independent request waterfalls for routines, categories, streak summary, and upcoming occurrences.
6. Warm authenticated dashboard content SHOULD become useful within 3 seconds on a representative mobile connection; cold-host wake-up SHALL show explicit “Waking Daycraft…” status rather than a generic network error.
7. Sheets not required for initial paint SHALL be lazy-loaded where this reduces the primary bundle without delaying first interaction unreasonably.
8. Category, routine, block, and checklist mutations SHALL invalidate only affected cache keys and SHALL not force a full-browser reload.
9. Failed requests SHALL distinguish timeout, offline/unreachable, validation, authorization, and server failure.
10. Analytics failures SHALL remain non-blocking and SHALL not display user-facing errors or prevent authentication.

### Requirement 9 — Accessibility and mobile usability

**User story:** As a user with assistive technology or reduced motion, I want the same complete planning flow.

#### Acceptance criteria

1. All dialogs/sheets SHALL have an accessible name, focus trap, Escape/backdrop handling where appropriate, body scroll lock, and trigger focus restoration.
2. Icon-only controls SHALL have an accessible name; decorative icons SHALL be hidden from assistive technology.
3. Category and status choices SHALL expose selected state programmatically.
4. Horizontal category/date scrollers SHALL remain operable by touch, keyboard, and assistive technology and SHALL expose their navigation purpose.
5. Body text SHALL not render below 14px on mobile; 11px type is reserved for uppercase micro-labels.
6. Text SHALL wrap rather than silently truncate user-authored routine, category, and block names unless the full value is available in the accessible name and an adjacent details surface.
7. Error messages SHALL be associated with their fields and announced once.
8. The product SHALL pass responsive checks at 320, 375, 390, 430, 768, 1280, and 1440px with no document-level horizontal overflow.

### Requirement 10 — Migration and data compatibility

**User story:** As an existing user, I want the app to improve without losing or corrupting routines I already created.

#### Acceptance criteria

1. A migration SHALL create account-owned category records and map existing Career, Health, Language, Life, and Rest strings to those records.
2. Existing Faith blocks SHALL map to an archived/read-only legacy category and remain renderable.
3. Unknown stored category strings SHALL map to account-owned archived legacy categories rather than fail enum hydration.
4. Migration SHALL retain the existing category string until all rows are backfilled and all API clients use category IDs.
5. Timeline entries SHALL gain a nullable `color_override` validated as six-digit hex.
6. Category and occurrence migrations SHALL be reversible or SHALL document why rollback would lose newly created data.
7. During migration, schedule resources SHALL provide enough compatibility data for the current frontend until the new frontend is deployed.
8. Existing routine-level custom colors SHALL remain unchanged.

### Requirement 11 — Code structure and cleanup

**User story:** As a maintainer, I want feature code separated by responsibility so future UX improvements do not make the dashboard fragile.

#### Acceptance criteria

1. `DashboardPage` SHALL remain a composition root and SHALL delegate routine selection, schedule data, occurrence/streak data, and checklist mutations to focused hooks/services.
2. Category presentation SHALL resolve through one frontend adapter/resource; components SHALL not hardcode the five live categories.
3. Effective block color SHALL be computed in one shared presenter/helper, not independently in each component.
4. Streak calculations SHALL live on the backend and SHALL not be reconstructed from current checklist state in React.
5. Current/upcoming calculations SHALL live in one backend occurrence resolver and SHALL not be duplicated among NowCard, reminders, and assistant code.
6. Superseded assistant help text referring to edit mode, top-right pencil, old day tabs, or old colored routine pills SHALL be removed or rewritten.
7. Dead files SHALL be removed only after repository-wide import/reference checks and validation.
8. Temporary mail-diagnostic routes marked for deletion SHALL be reviewed separately for production removal; cleanup SHALL not silently remove an operational troubleshooting path.
9. No new dependency SHALL be added unless existing React/Laravel/platform capabilities cannot satisfy the requirement, and any dependency SHALL be pinned to an exact reviewed version.

## 5. Proposed mobile flow

### Today

1. Compact identity/date header
2. Seven-day strip (today centered; completion dots are routine-level summaries)
3. Current/next focus card
4. Routine progress card: streak + completed habits + seven-occurrence history
5. Schedule section with one Add button
6. Contextual category filter only when it can narrow the schedule
7. Timeline cards
8. Habits/checklist
9. Reminders and other secondary settings

### Add/edit block sheet

1. What will you do?
2. Starts / Ends
3. Primary Save action
4. Personalize disclosure
   - Category picker
   - Create category
   - Inherit category color / custom color
5. Destructive action appears only while editing and requires confirmation

### Categories

- Inline creation from block editor for speed
- Full manager under Profile → Planning preferences for rename, recolor, icon, reorder, archive, and reassignment
- Category is never required merely to create a block; a configurable default category is used

### Streak details

- Current streak and best streak
- Seven most recent scheduled occurrences, not seven calendar days
- Tap opens a history sheet with factual statuses: Complete, Missed, Today, or Not tracked
- No shame copy and no “streak lost” animation

## 6. Explicit non-goals for this feature

- Social feeds, public leaderboards, challenges, coins, avatars, or competitive gamification
- Natural-language schedule parsing
- Full month calendar
- Drag-and-drop timeline editing on mobile
- AI-generated routines
- Voice-guided timers
- Calendar-provider integrations
- Backdating a perfect authoritative streak from incomplete historical logs

## 7. Decisions proposed for approval

The requirements above use these product decisions. They must be approved or changed before design begins:

1. **Category scope:** Categories are account-wide and reusable across routines—not private to one routine.
2. **Category limit:** Maximum 20 active categories; archive instead of destructive deletion.
3. **Routine streak:** A scheduled routine occurrence succeeds when all snapshotted habits are complete. Zero-habit routines are not tracked.
4. **Grace period:** No automatic grace day. Today remains pending until local midnight; after that an incomplete scheduled occurrence breaks the streak.
5. **Upcoming horizon:** Show the next three blocks occurring within seven days.
6. **Timezone:** Store an IANA timezone per account and use it as the sole boundary for dates, streaks, overnight blocks, and reminders.
7. **Historical start:** Authoritative routine streaks begin at rollout; older logs may appear only as non-authoritative activity.
8. **Category filter change:** Replace the current always-visible All + five + zero counts with All + only categories actually used in the viewed schedule; hide the filter when it cannot narrow anything.

## 8. Requirement traceability summary

| Goal from request | Covered by |
|---|---|
| Add more categories | Requirements 3, 10 |
| Make UI interactive and colors visible | Requirements 1, 7, 9 |
| Routine tracking and streaks | Requirement 4 |
| Custom hex per block | Requirement 5 |
| Upcoming schedule | Requirement 6 |
| Every UI element useful | Requirements 1, 2, 7 |
| Smooth login/create/delete | Requirement 8 |
| Mobile users first | Requirements 1, 9 and Proposed mobile flow |
| Clean scalable code and dead-code removal | Requirement 11 |
