---
name: analytics-review
description: Use when Rob asks how the site's content is doing, where readers get stuck or drop off, which chapters/widgets/quiz questions need work, which traffic sources bring engaged readers, or anything else that needs reading the site's Google Analytics (GA4) data — he finds the GA4 interface confusing, so pull the numbers yourself and turn them into concrete content advice.
---

# Analytics review

Pull the site's GA4 data through the Google Analytics MCP server and turn it
into a short, prioritised list of what to fix in the content. Rob wants
advice, not a dashboard: every finding should name a chapter, section,
widget or quiz question and say what to do about it.

[`docs/analytics.md`](../../../docs/analytics.md) is the source of truth for
which events exist, when each fires, and their parameters. Read it first if
anything below seems out of date.

## 1. Check access

The MCP tools are named `mcp__analytics-mcp__*` (find them with ToolSearch,
query `analytics`). If they aren't available, stop and point Rob at the
"Querying from Claude" setup in `docs/analytics.md` — don't try to scrape GA
another way.

Then:

- **Find the property.** Call `get_account_summaries` and pick the property
  for this site (measurement ID `G-4BJPJ1RZR6`; the property ID is a number,
  different from that). Use it as `property_id` everywhere.
- **Check the custom definitions.** Call `get_custom_dimensions_and_metrics`.
  Event parameters are only queryable once registered, as
  `customEvent:<param>` (e.g. `customEvent:chapter`). If any of `chapter`,
  `section`, `widget`, `question`, `correct`, `score`, `total` are missing,
  say so up front, list exactly which, and do what you can without them —
  e.g. event counts by `eventName` still work.

## 2. Pull the data

Default window: the last 28 days (`28daysAgo` → `yesterday`); also pull the
28 days before that when a trend matters. `run_report` takes snake_case
protobuf-style fields:

```json
{
  "property_id": 123456789,
  "date_ranges": [{"start_date": "28daysAgo", "end_date": "yesterday"}],
  "dimensions": ["eventName", "customEvent:chapter"],
  "metrics": ["eventCount", "totalUsers"],
  "dimension_filter": {"filter": {"field_name": "eventName",
    "in_list_filter": {"values": ["chapter_start", "chapter_complete"]}}}
}
```

Reports to run (combine where one query can answer several):

| Question | Query |
|---|---|
| Which chapters do readers finish? | `chapter_start` vs `chapter_complete`, users by `customEvent:chapter` — or `run_funnel_report` with those two steps and `{"breakdown_dimension": "customEvent:chapter"}` |
| Where in a chapter do they stop? | `section_reached` users by `customEvent:chapter` + `customEvent:section`; order sections as they appear in `src/app/(tutorial)/<chapter>/content.mdx` (heading ids are the slugified `##` text) |
| Which widgets get used? | `widget_interact` users by `customEvent:chapter` + `customEvent:widget`, divided by that chapter's `chapter_start` users |
| Which quiz questions are hard? | `quiz_answer` events by `customEvent:chapter` + `customEvent:question` + `customEvent:correct` |
| How do quizzes go overall? | `quiz_complete` by `customEvent:chapter`, with metrics `customEvent:score` and `customEvent:total` (sum score / sum total = average) |
| Who opens the notebooks? | `colab_open` users by chapter, against `chapter_complete` |
| Which sources bring readers who stay? | `chapter_start` and `chapter_complete` users by `sessionSource` / `sessionCampaignName` (outreach uses `?utm_source=educator`) |
| Is anyone here right now? | `run_realtime_report` — only when asked |

Use `totalUsers` rather than `eventCount` for rates: one reader can fire
`chapter_start` many times by revisiting.

## 3. Read it against the content

Numbers alone aren't advice. Before recommending anything, open the chapter
in question (`content.mdx`, `quiz.mdx`, the widget source under
`src/components/widgets/`) and look at what the reader actually meets at the
drop-off point.

What to look for:

- **Steep section drop-off.** A section reached by far fewer readers than
  the one before it usually means the earlier section lost them: too long,
  too abstract, or a concept used before it's explained. Say which.
- **Widgets nobody touches.** Low interaction share may mean the widget
  doesn't invite play (no obvious first action) or sits where readers have
  already left. Compare against how many readers reached its section.
- **Quiz questions most people miss.** Check whether the chapter actually
  teaches that point clearly, or whether the question is ambiguous. Quote
  the question and the relevant passage. A question nearly everyone gets
  right may be too easy to be useful.
- **Chapters people start but don't finish**, compared with their neighbours.
- **Sources** whose readers start but rarely complete, versus ones that stay.

Be honest about small numbers: with tens of readers, a 10-point difference is
noise. State the reader count behind each claim and don't rank findings on
counts too small to mean anything.

## 4. Report

Lead with a three-to-five line summary, then a numbered list of findings,
most important first. Each finding:

- **Bold one-line claim**, then the evidence (the numbers and date range),
  then the specific change you'd make and the file it's in.

End with anything you couldn't measure (missing custom definitions, events
not yet wired, too little data) and what would fix it. Don't edit content
unless Rob asks — this skill diagnoses; changes are a separate step.
