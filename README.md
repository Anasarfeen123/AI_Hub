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
| MongoDB Atlas | Members, page content, and revision history |

In production the Express server also serves the built React app, so the API and the site share one origin — which keeps the session cookie first-party.

## How access works

There is no public sign-up. A Google account can sign in **only if its email is on the member list** in MongoDB. That list is the sole access check, so a personal address works fine if a lead adds it.

The allowlist is re-checked on *every request*, not just at login — so adding or revoking someone takes effect on their next page load, with no redeploy.

## Running locally

Requires Node 18+ and a MongoDB connection string.

```bash
# 1. Configure
cp server/.env.example server/.env     # fill in Mongo + Google OAuth credentials
cp client/.env.example client/.env

# 2. Install
npm install --prefix server
npm install --prefix client

# 3. Seed content and members (first run only)
cd server
node scripts/seedPages.js              # loads client/src/content/*.md into MongoDB
npm run import-members -- members.csv  # your own CSV of name,email
node scripts/setRole.js you@example.com admin
```

Then run both halves, in separate terminals:

```bash
cd server && npm run dev     # API on :4000
cd client && npm run dev     # app on :5173
```

Open http://localhost:5173.

## Content

Page content lives in **MongoDB**, not in this repo — members edit it in the browser and every save is versioned.

The Markdown in `client/src/content/` is the **initial seed** used by `scripts/seedPages.js`. Editing those files does not change the live site; `seedPages.js` skips pages that already exist so a redeploy never overwrites members' work. Pass `--force` only if you deliberately want to reset pages back to the repo copies.

## Administration

Admins get a **Changes** link in the header:

- **`/admin`** — every edit across the hub, with diffs and one-click restore
- **`/admin/members`** — add members individually or in bulk, promote admins, deactivate accounts

Equivalent command-line tools remain as a fallback:

```bash
node scripts/setRole.js <email> admin   # promote
node scripts/setRole.js --list          # list admins
npm run import-members -- members.csv   # bulk import
```

## Deployment

Hosted on Render, deploying automatically on every push to `main`.

- **Build:** `npm install --prefix client --include=dev && npm run build --prefix client && npm install --prefix server`
- **Start:** `node server/src/index.js`

`--include=dev` is required because `NODE_ENV=production` otherwise makes npm skip the dev dependencies that Vite needs to build.

Environment variables: `MONGODB_URI`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, `SERVER_URL`, `CLIENT_URL`, `NODE_ENV`. Set `SERVER_URL` and `CLIENT_URL` to the same deployed URL, and register `<that URL>/auth/google/callback` as an authorised redirect URI in Google Cloud Console.

Adding members is a database change, not a code change — it needs no deploy.

## Contributing

Every member can edit any page directly from the site: open a page and hit **Edit**. Changes go live immediately and are recorded in the history, so a lead can restore an earlier version if something goes wrong.

Code changes go through pull requests as usual.

## License

Content is shared for educational use by the MIC VIT Chennai community. Add a license file here if a specific one is required (e.g. CC-BY-4.0 for content, MIT for any code).
