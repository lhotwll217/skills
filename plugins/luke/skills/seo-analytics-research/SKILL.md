---
name: seo-analytics-research
description: Research SEO questions with live DataForSEO evidence. Use for keyword, demand, trend, intent, SERP, ranking, competitor, link, or on-page analysis.
---

# SEO analytics research

Answer the SEO question with the smallest useful body of live evidence. This skill is an atomic research capability: a larger writing, content, or growth workflow may invoke it and decide what to do with the findings.

## 1. Confirm the question

Inspect the supplied artifact and context. Briefly confirm:

- the SEO question or hypothesis;
- the subject: topic, query, page, or domain;
- target country and language;
- the evidence needed from this pass.

Ask only for inputs that block the research. State the short research plan before running it; keep this confirmation lightweight.

## 2. Use DataForSEO

Use the available `dfs-mcp` DataForSEO tools and inspect their current schemas before calling them. If the tools are unavailable, report that prerequisite instead of substituting undated or unrelated evidence.

For DataForSEO Labs calls, set the location and language explicitly. Default to `United States` and `en` only when the context gives no better market. Keep every metric tied to its location, language, source, and pull date. Label saved exports as historical evidence with their original pull date.

## 3. Build a bounded keyword universe

Start with several distinct seed classes:

- the product/category language;
- the problem and outcome language;
- buyer or service language;
- variants already used by customers, competitors, or the draft.

Run a compact keyword overview first. Then expand only promising seeds with suggestions, related keywords, or keyword ideas.

Use the endpoints by purpose:

- **Keyword overview / Google Ads volume:** demand, CPC, competition, trend fields, and a fast comparison of known phrases.
- **Keyword suggestions:** phrase-adjacent expansion with less drift.
- **Related keywords:** broader discovery around a validated topic.
- **Keyword ideas:** wide exploration; expect noise and large responses.
- **Historical keyword data / Trends:** direction and seasonality. Compare phrases separately when a normalized multi-keyword Trends response obscures the signal.
- **Search intent:** informational, commercial, navigational, or transactional classification.

When an ideas endpoint drifts into broad consumer terms, return to phrase-scoped suggestions. Apply a reasonable volume floor only after preserving strategically relevant low-volume buyer terms.

## 4. Test the search landscape

Keyword metrics do not establish fit. For each serious target:

1. Inspect the live organic SERP.
2. Identify the dominant intent and page type.
3. Note ranking domains, authority mismatch, SERP features, and whether the query rewards guides, tools, category pages, comparisons, or service pages.
4. Use SERP competitors and domain competitors to distinguish search competitors from business competitors.

For an existing domain, add:

- ranked keywords and domain rank overview;
- pages already earning impressions or rankings near the target topic;
- backlink summary, referring domains, anchors, and competitor gaps;
- an on-page crawl or instant-page analysis for the URLs under review.

A high-volume phrase is not an opportunity when the intent or winning page type conflicts with the proposed page.

## 5. Find link leverage

Inspect the site's existing content and live rankings before recommending links.

- Propose internal links only where the source page is relevant and the anchor reads naturally.
- Prefer pages that already rank or carry authority when they genuinely support the target page.
- Separate **internal-link opportunities** from **backlink opportunities**.
- For backlinks, identify linkable evidence, tools, original data, or reference material; do not equate adding outbound citations with earning backlinks.
- Preserve authoritative external citations when they support claims. SEO wording must not weaken source quality.

## 6. Interpret metrics as a set

Record volume, trend or YoY change, keyword difficulty, CPC, intent, and SERP fit together.

- **Volume** estimates demand, not attainable traffic.
- **Trend / YoY** indicates direction; inspect the historical series before treating one percentage as durable growth.
- **Keyword difficulty** estimates ranking competition, not relevance.
- **CPC** is a proxy for advertiser value, not proof of buyer intent.
- **Intent and SERP fit** decide whether the page can satisfy the query.
- **Existing rankings and links** reveal leverage the raw keyword table misses.

Label zero-volume and missing-data terms distinctly. Do not turn either into a precise claim of no demand.

## 7. Handle large MCP responses

Keyword ideas, historical data, and Trends responses often exceed the harness output limit and are saved to files.

When that happens:

1. Preserve the result path.
2. Parse the JSON directly with a small script.
3. Confirm the item count and inspect the response status.
4. Extract only decision fields such as keyword, volume, CPC, competition, difficulty, intent, trend, and monthly history.
5. Account for the full result set before presenting a shortlist.

Do not infer the result from the visible prefix of a truncated response.

## 8. Return the evidence

Return the result in the form requested by the calling task. Do not create or edit a durable artifact unless requested or required by an established repository workflow.

For a standalone research answer, this compact structure is available:

```markdown
# SEO research: <decision>

Market: <location / language>
Sources: <DataForSEO endpoints and other primary sources>
Pulled: <date>

## Decision
<one short recommendation>

## Evidence
| Query / page | Volume | Trend | KD | CPC | Intent | SERP fit | Implication |

## Search landscape
<winning page types, competitors, authority constraints, SERP features>

## Link opportunities
<specific internal sources, anchors, and backlink-worthy assets>

## Recommended changes
<small concrete edits, ordered by expected value>

## Limits
<missing data, estimates, ambiguities, and what was not tested>
```

Separate measured evidence from interpretation. When a calling workflow asks for changes, show the evidence-to-change chain and leave the final editorial or product decision to that workflow.

## Completion criterion

The research is complete when it answers the confirmed question, every conclusion traces to dated evidence, the target market is explicit, relevant search intent or SERP evidence has been checked, and every large result used in the analysis is fully accounted for.
