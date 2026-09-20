# All Things Asia — Korean Adoptee Hub

A static site with a **Notion-powered blog** and a verified resource directory for Korean adoptees.

## How the blog works

1. Write a page in the Notion database **Blog Posts** (inside the page "All Things Asia Website CMS").
2. Set `Status` to **Published** and fill in `Published` (date), `Category`, `Excerpt`.
3. The site reads Notion live through `/api/posts` and `/api/post?slug=…`. No rebuild, no deploy. New posts appear within a minute.

Notion properties used: `Title`, `Slug`, `Status`, `Published`, `Category`, `Excerpt`, `Cover Image URL`, `Author`, `Tags`, `Featured`.
If `Slug` is empty, one is generated from the title.

## Pages

| File | What it is |
|---|---|
| `index.html` | Home: the 5-step search funnel, key numbers, latest posts |
| `blog.html` | Blog index with category filters (from Notion) |
| `post.html` | Single post reader (`post.html?slug=…`) |
| `resources.html` | 5 resource sections: DNA, associations, records, living in Korea, trips |
| `stats.html` | Korean adoption statistics with charts |
| `assets/` | `site.css`, `site.js`, `orgs.js` (country associations), `stats.js` (data + charts) |
| `api/` | Vercel serverless functions that read Notion |

## Environment variables (set in Vercel)

- `NOTION_TOKEN` — internal integration token for the "All Things Asia Website" connection
- `NOTION_DB_ID` — id of the Blog Posts database

Locally the same values live in `.env.local`, which is git-ignored.

## Local preview

```bash
node dev-server.mjs   # http://localhost:8795
```

## Data sources for stats.html

- e-나라지표 indicator 2708 (국내외 입양 현황)
- KOSIS table DT_11770N001
- data.go.kr dataset 15127995 (보건복지부 입양 아동 현황)
- Ministry of Health and Welfare Adoption Day press releases
