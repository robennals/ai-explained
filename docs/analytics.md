# Analytics

The site sends a small set of typed events to Google Analytics 4 (GA4) so we
can tell whether readers learn, and which sources bring readers who stay.
Vercel Analytics still records pageviews alongside it.

- **One helper.** Every event goes through `track(event, params)` in
  [`src/lib/analytics.ts`](../src/lib/analytics.ts). Event names and their
  parameters are a TypeScript type, so a typo fails to compile.
- **No personal data.** Children use this site. Parameters are chapter slugs,
  widget names, question numbers, booleans and scores — never names, emails,
  free text or user ids.
- **Where it runs.** GA loads on production, and on Vercel preview
  deployments in debug mode so new events can be checked before they ship.
  Local dev and tests send nothing.
- **Reading the data.** The `analytics-review` skill
  ([`.claude/skills/analytics-review/`](../.claude/skills/analytics-review/SKILL.md))
  has Claude pull the numbers and say where readers get stuck. See
  [Querying from Claude](#querying-from-claude) for its one-time setup.

## Events

| Event | When | Parameters |
|---|---|---|
| `chapter_start` | chapter page loads | `chapter` |
| `section_reached` | a `##` heading scrolls into view, once per section per page load | `chapter`, `section` (heading id) |
| `chapter_complete` | the quiz scrolls into view, or the end of the chapter for chapters without one | `chapter` |
| `widget_interact` | first pointer/keyboard interaction inside each widget, once per page load | `chapter`, `widget` (the widget's title) |
| `quiz_answer` | a quiz question is answered (first attempt only) | `chapter`, `question` (1-based), `correct` |
| `quiz_complete` | all questions answered (first attempt only) | `chapter`, `score`, `total` |
| `colab_open` | a `<TryItInPyTorch>` link is clicked | `chapter` |
| `educator_page_view` | `/educators` or any `/{slug}/teach` loads | `page` |
| `educator_signup` | the "I'm using this" form submits successfully | — |

Details worth knowing when reading the numbers:

- **"Page load" means a visit to the page.** Moving between chapters with the
  site's own links counts as a new visit, so returning to a chapter fires
  `chapter_start` and its section events again.
- **"First attempt" survives reloads.** Answers restored from the browser's
  saved quiz state are not re-sent. After the reader presses "Retake quiz",
  that quiz sends no more `quiz_*` events from that browser.
- **Widget names are widget titles.** Every widget passes a distinct `title`
  to `WidgetContainer`, so renaming a widget starts a new row in reports.
- **Educator events are not wired yet.** The `/educators` and `/teach` pages
  don't exist yet; when they land they call
  `track("educator_page_view", { page })` and `track("educator_signup", {})`.
- **Source tracking.** GA4 reads `utm_source` / `utm_campaign` from the
  landing URL itself. Nothing in the app redirects or rewrites the URL on
  first load, so links like `?utm_source=educator` arrive intact.

## One-time GA4 setup (manual)

Event parameters only show up in GA4 reports after they are registered as
custom definitions, and registration is **not retroactive** — data sent
before it is not reportable by that parameter. Do this as soon as the code
ships.

In GA4 → **Admin → Data display → Custom definitions**:

| Create as | Name (suggested) | Event parameter | Scope / unit |
|---|---|---|---|
| Custom dimension | Chapter | `chapter` | Event |
| Custom dimension | Section | `section` | Event |
| Custom dimension | Widget | `widget` | Event |
| Custom dimension | Quiz question | `question` | Event |
| Custom dimension | Quiz correct | `correct` | Event |
| Custom dimension | Educator page | `page` | Event |
| Custom metric | Quiz score | `score` | Standard |
| Custom metric | Quiz total | `total` | Standard |

Optionally, to keep preview-deployment testing out of the real numbers:
**Admin → Data collection and modification → Data filters → Create filter →
Developer traffic → Exclude**. Events from previews carry `debug_mode`, which
is what that filter matches. A new filter starts in **Testing** (it only labels
matching data); switch it to **Active** to drop that data — which is permanent
for what it drops, and never touches data already collected. DebugView keeps
working either way. Without the filter, preview testing is counted in reports.

## Watching events live (DebugView)

1. Open a Vercel preview deployment of the branch (previews send events in
   debug mode).
2. In GA4 go to **Admin → Data display → DebugView**.
3. Use the preview: scroll a chapter, poke a widget, answer a quiz question.
   Your device appears in the device picker at the top, and each event shows
   up in the timeline within a few seconds; click one to see its parameters.

DebugView only shows debug-mode traffic, so production readers never appear
there. Normal reports take up to a day to include new events.

## Building the chapter funnel

This shows what share of readers who start each chapter get to its end.

1. **Explore → Funnel exploration**.
2. Steps: step 1 is the event `chapter_start`; step 2 is the event
   `chapter_complete`. Leave "Make open funnel" off.
3. Under **Breakdown**, add the `Chapter` custom dimension (it must be
   registered first — see above).
4. Optionally add `section_reached` steps between the two, filtered to a
   single chapter, to see which section loses readers.

## Querying from Claude

GA4's interface is hard to navigate, so the repo includes the
`analytics-review` skill: ask Claude Code "how is the content doing?" and it
queries GA4 through Google's official Analytics MCP server, then reports
where readers drop off and what to fix.

Setup, once per machine. The server is read-only.

1. **Pick a Google Cloud project** and, in it, enable the **Google Analytics
   Admin API** and **Google Analytics Data API**.
2. **Create an OAuth client** in that project (APIs & Services → Credentials →
   Create credentials → OAuth client ID → Desktop app) and download its JSON.
3. **Log in** with a Google account that can see the GA4 property:

   ```bash
   gcloud auth application-default login \
     --scopes https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/cloud-platform \
     --client-id-file=PATH_TO_CLIENT_JSON
   ```

   Note the path in its "Credentials saved to file: [...]" line — normally
   `~/.config/gcloud/application_default_credentials.json`.
4. **Register the server with Claude Code** (needs `pipx`, Python 3.10+):

   ```bash
   claude mcp add analytics-mcp --scope user \
     -e "GOOGLE_APPLICATION_CREDENTIALS=$HOME/.config/gcloud/application_default_credentials.json" \
     -e "GOOGLE_PROJECT_ID=YOUR_PROJECT_ID" \
     -e "GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID" \
     -- pipx run analytics-mcp
   ```

   It is registered per user rather than in a committed `.mcp.json` because
   the credentials path and project are per machine, and a committed config
   would fail to start for anyone without them.

Source: [googleanalytics/google-analytics-mcp](https://github.com/googleanalytics/google-analytics-mcp).
