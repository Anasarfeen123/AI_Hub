<img src="client/src/assets/mic-logo.png" alt="MIC logo" width="72" />

# AI/ML Resource Hub

**Microsoft Innovations Club (MIC), VIT Chennai**

A members-only knowledge base for MIC's AI/ML learning track — a single place to learn Artificial Intelligence from beginner foundations through to advanced research, with curated, vetted resources instead of scattered links.

Members sign in with Google, read and edit every page wiki-style, and track their own progress through the roadmap. Leads can review every change and restore earlier versions.

**Live site:** https://mic-ai-ml-resource-hub.onrender.com

## Stack

| Part | What it is |
|---|---|
| `client/` | React (Vite) — the whole front end |
| `server/` | Express + Passport (Google OAuth) + Mongoose |
| MongoDB Atlas | Members, page content, structure, and revision history |

In production the Express server also serves the built React app, so the API and the site share one origin — which keeps the session cookie first-party.

## How access works

There is no public sign-up. A Google account can sign in **only if its email is on the member list** in MongoDB. That list is the sole access check, so a personal address works fine if a lead adds it.

The allowlist is re-checked on *every request*, not just at login — so adding or revoking someone takes effect on their next page load, with no redeploy.

## Roles

Three ranks, in ascending order of power. Every permission check compares ranks, so the rule is always *you may act on someone you outrank*.

| | Member | Admin | Lead |
|---|:---:|:---:|:---:|
| Read every page | ✅ | ✅ | ✅ |
| **Edit any page** (publishes immediately) | ✅ | ✅ | ✅ |
| See history and the contributors board | ✅ | ✅ | ✅ |
| Revert a revision | — | ✅ | ✅ |
| Create, reorder, hide, delete pages | — | ✅ | ✅ |
| Add members; deactivate a member | — | ✅ | ✅ |
| Promote or demote an **admin** | — | — | ✅ |
| Appoint or remove a **lead** | — | — | ✅ |

`admin` is for sub-leads and department volunteers; `superadmin` — shown as **Lead** in the UI — is for the board.

Two consequences worth knowing:

- **Admins cannot touch each other.** Equal ranks don't outrank, so one admin can't demote, deactivate or promote another. Only a lead can.
- **Admins cannot create admins.** Otherwise they'd mint a peer they then couldn't manage, or their own superior.

Leads *can* manage each other, so a board handover works entirely in the UI. Two guards prevent lockout: nobody can demote or deactivate themselves, and the last active lead cannot be removed.

## Structure is data, not code

Navigation and the roadmap are **derived from the pages themselves** — a page's `section`/`order` place it in the nav, and an optional `roadmapStage` puts it on the roadmap. There is no separate nav table to fall out of sync.

Admins create and arrange pages from **Pages** in the header; nothing needs a pull request. Deleting a page that others link to is refused first, naming the pages that would break, and only goes ahead on an explicit confirm.

## Contributions

Every page shows **who last edited it and when**. The editor's name is looked up live, so it follows their current name and falls back to their email if they've left.

`/contributors` ranks members by **words added, not number of edits** — the point is to reward writing, not saving often. Each save diffs against the previous version (line-level LCS) and stores the counts on the revision, so the board is a simple aggregation.

Three things deliberately don't count: the original Markdown import, blank-line reformatting, and reverts — restoring someone's work credits *them*, not the person who clicked revert.

## Themes

Light and dark, with a toggle in the header. Three states, not two: the default follows the OS, and choosing light or dark stores an explicit override. Every colour is a token, so the light theme is one block of overrides rather than a second stylesheet.

## Running locally

Requires Node 18+ and a MongoDB connection string.

```bash
# 1. Configure
cp server/.env.example server/.env     # fill in Mongo + Google OAuth credentials
cp client/.env.example client/.env

# 2. Install
npm install --prefix server
npm install --prefix client

# 3. Seed content, structure and members (first run only)
cd server
node scripts/seedPages.js              # loads client/src/content/*.md into MongoDB
node scripts/seedStructure.js          # nav order + roadmap stages
npm run import-members -- members.csv  # your own CSV of name,email
node scripts/setRole.js you@example.com superadmin   # the first lead
```

The first lead has to be promoted from the terminal, because changing a lead is itself lead-only.

Then run both halves, in separate terminals:

```bash
cd server && npm run dev     # API on :4000
cd client && npm run dev     # app on :5173
```

Open http://localhost:5173.

> **Note:** `server/.env` points at whatever database you give it. If that's the production cluster, local testing writes to live data — including anything that publishes an edit.

## Content

Page content lives in **MongoDB**, not in this repo — members edit it in the browser and every save is versioned.

The Markdown in `client/src/content/` is the **initial seed** used by `scripts/seedPages.js`. Editing those files does not change the live site; `seedPages.js` skips pages that already exist so a redeploy never overwrites members' work. Pass `--force` only if you deliberately want to reset pages back to the repo copies.

## Administration

Admins and leads get extra links in the header — **Pages**, **Changes** — plus a **Manage members** button above the nav:

- **`/admin`** — every edit across the hub, with diffs and one-click restore
- **`/admin/pages`** — create, reorder, hide or delete pages; set roadmap placement
- **`/admin/members`** — add members individually or in bulk (with departments), manage roles, deactivate accounts
- **`/contributors`** — the leaderboard, visible to everyone

**Deactivating** a member kills their session immediately and blocks sign-in, but keeps their name on the list, their revisions in history, and their bylines intact. It also removes them from the leaderboard. Fully reversible.

Command-line equivalents:

```bash
node scripts/setRole.js <email> <member|admin|superadmin>   # change a role
node scripts/setRole.js                                     # list everyone above "member"
npm run import-members -- members.csv                       # bulk import

node scripts/backfillStats.js --write                       # recompute contribution stats
node scripts/excludeFromStats.js <email> --write            # keep test edits off the board
node scripts/excludeFromStats.js <email> --undo --write     # put them back
```

Both stats scripts preview their changes when run without `--write`, and nothing they do deletes history.

## Deployment

Hosted on Render, deploying automatically on every push to `main`.

- **Build:** `npm install --prefix client --include=dev && npm run build --prefix client && npm install --prefix server`
- **Start:** `node server/src/index.js`

`--include=dev` is required because `NODE_ENV=production` otherwise makes npm skip the dev dependencies that Vite needs to build.

Environment variables: `MONGODB_URI`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, `SERVER_URL`, `CLIENT_URL`, `NODE_ENV`. Set `SERVER_URL` and `CLIENT_URL` to the same deployed URL, and register `<that URL>/auth/google/callback` as an authorised redirect URI in Google Cloud Console.

`SESSION_SECRET` signs the session cookie. Anyone who has it can forge a signed session and bypass Google sign-in entirely, so treat it like a password: never commit it, never screenshot it, and rotate it if it's ever exposed. Rotating signs everyone out once.

Adding members is a database change, not a code change — it needs no deploy.

## Contributing

Every member can edit any page directly from the site: open a page and hit **Edit**. Changes go live immediately and are recorded in the history, so a lead can restore an earlier version if something goes wrong.

Code changes go through pull requests as usual.

## License

Content is shared for educational use by the MIC VIT Chennai community. Add a license file here if a specific one is required (e.g. CC-BY-4.0 for content, MIT for any code).
