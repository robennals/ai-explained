# Analytics

The site sends a small set of typed events to Google Analytics 4 (GA4) and to
PostHog, so we can tell whether readers learn, and which sources bring readers
who stay. Vercel Analytics still records pageviews alongside them.

- **Moving to PostHog.** GA sets cookies, which in the UK and EU need a consent
  banner, and children use this site. PostHog runs in cookieless mode: it
  stores nothing on the reader's device. Both run side by side until PostHog's
  numbers check out, then GA goes. See [PostHog](#posthog).
- **One helper.** Every event goes through `track(event, params)` in
  [`src/lib/analytics.ts`](../src/lib/analytics.ts), which sends it to both
  tools with the same name and parameters. Event names and their parameters
  are a TypeScript type, so a typo fails to compile.
- **No personal data.** Children use this site. Parameters are chapter slugs,
  widget names, question numbers, booleans and scores — never names, emails,
  free text or user ids.
- **Where it runs.** GA and PostHog load on production, and on Vercel preview
  deployments so new events can be checked before they ship (GA in debug
  mode; PostHog tags each event with `vercel_env`). Local dev and tests send
  nothing.
- **Reading the data.** The `analytics-review` skill
  ([`.claude/skills/analytics-review/`](../.claude/skills/analytics-review/SKILL.md))
  has Claude pull the numbers from GA4 and say where readers get stuck. See
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
- **Source tracking.** GA4 and PostHog read `utm_source` / `utm_campaign`
  from the landing URL itself. Nothing in the app redirects or rewrites the URL on
  first load, so links like `?utm_source=educator` arrive intact.

## PostHog

PostHog is set up in [`src/lib/posthog.ts`](../src/lib/posthog.ts) and started
from [`src/instrumentation-client.ts`](../src/instrumentation-client.ts), which
runs before React hydrates the page, so the first render's `chapter_start`
isn't lost.

- **Cookieless.** With `cookieless_mode: "always"` PostHog uses no cookies,
  local storage or session storage. Its servers recognise a reader for one day
  with a hash of the IP address, browser and a salt that changes daily, then
  throw the IP address away.
- **What it records.** Page views (including moves between pages with the
  site's own links) and the events above. Click autocapture, page-leave
  events, session recordings, surveys, heatmaps and error capture are all off
  in code, to stay inside the free plan's 1 million events a month.
- **Previews share the project.** The free plan has one project, so every
  event carries `vercel_env` (`"production"` or `"preview"`). Filter reports
  to `vercel_env = production`.
- **Proxied.** Requests go to `/ingest` on the site's own domain, which
  `next.config.ts` forwards to PostHog's EU servers, so ad blockers block it
  less often.
- **Off without a key.** It loads only where GA does, and only when
  `NEXT_PUBLIC_POSTHOG_KEY` is set.
- **Known gaps.** No country or city data, and returning readers look new
  each day. Known bots (Googlebot and the like) are dropped in the browser by
  their user agent, but PostHog's server-side bot detection doesn't run. Readers sharing an IP address and browser — a
  class on school Chromebooks — count as one "user".

### One-time PostHog setup (manual)

1. **Create a PostHog project** on EU cloud (the region is fixed at signup).
2. **Turn on "Cookieless server hash mode"** under Project settings → Web
   analytics. Without it, PostHog silently drops every event.
3. **Check "Discard client IP data" is off**, if the project has that setting.
   The daily hash needs the IP address, and cookieless mode already removes it.
4. **Add `NEXT_PUBLIC_POSTHOG_KEY`** (the project key, which is public by
   design) in Vercel for Production and Preview, then redeploy.
5. **Optional: add a card and set a billing limit.** That keeps 7 years of
   history instead of the free plan's 1.

### Checking PostHog works

On a preview deployment with the key set:

1. **Nothing stored.** After reading a chapter, `document.cookie` and
   `localStorage` have no keys starting `ph_` or containing `posthog`. GA's
   `_ga` cookies are still there while GA runs.
2. **Events arrive.** PostHog's **Activity** view shows a page view,
   `chapter_start`, `section_reached`, `widget_interact` and `quiz_answer`,
   with their parameters and `vercel_env: "preview"`.
3. **Readers stay distinct.** Open the preview from two networks (Wi-Fi and a
   phone on mobile data): they should get different `distinct_id`s. One shared
   id means the proxy is hiding the reader's IP address.
4. **One page view per move.** Following next/previous chapter links adds
   exactly one page view each time.
5. **Same-site requests.** The Network tab shows PostHog requests going to
   `/ingest` on the site's domain.

### Reading drop-off in PostHog

Make a **Trends** insight counting `section_reached` events, broken down by
`section`, filtered to one `chapter` and to `vercel_env = production`. Plain
event counts are unaffected when a classroom merges into one "user"; funnel
insights are, so treat funnels as a secondary view. To compare phones with
desktops, add a breakdown by **Device type**, which PostHog records on every
event without any code of ours.

### Comparing with GA

To decide whether PostHog can be trusted, compare daily `chapter_start` counts
per chapter in both tools over the same dates. They should roughly match.
PostHog may run a little higher, since its proxy dodges some ad blockers.

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
