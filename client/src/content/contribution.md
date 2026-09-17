# Contributing to the Hub

This hub is built and maintained by the department community — students and faculty adding resources, fixing errors, and writing new topic pages. If you learned something the hard way and wish a page like this had existed, that's exactly the kind of contribution this project wants.

## Ways to contribute

- **Add a resource** — a course, book, paper, tool, or dataset that belongs in [Resources](resources/index.md) or a specific topic page's "Learning resources" section.
- **Fix an error** — typos, broken links, outdated information, or anything technically wrong.
- **Improve an existing page** — clearer explanations, better examples, more accurate project descriptions.
- **Write a new page or project brief** — expanding a section that's thin, or adding a project idea to [Project Ideas](projects/index.md).
- **Improve the site itself** — styling, navigation, or the app's code, via a pull request.

Small contributions (a resource link, a typo fix) are just as welcome as large ones.

## How to edit a page

You don't need git, a terminal, or a GitHub account. Every member can edit directly:

1. Open the page you want to change.
2. Click **Edit** at the top right of the page.
3. Make your change in Markdown. Use the **Preview** tab to check how it will render.
4. Add a short note describing what you changed — it shows up in the page history.
5. Click **Save changes**.

Your edit goes live immediately. Every save is recorded with your name, so a lead can see exactly what changed and restore an earlier version if something goes wrong. Don't be afraid of breaking things — nothing is unrecoverable.

## Changing the app itself

Page *content* lives in the database and is edited on the site. The repository holds the application code — the React front end, the Express API, and the initial content seed.

```bash
git clone https://github.com/tarang802/AI_Hub.git
cd AI_Hub
npm install --prefix server && npm install --prefix client
```

Run the API and the app in two terminals:

```bash
cd server && npm run dev     # API on :4000
cd client && npm run dev     # app on :5173
```

Then open a pull request describing what changed and why.

## Page structure conventions

Every **topic page** (a page describing a specific concept — an algorithm, an architecture, a technique) should follow this structure, in this order:

```markdown
# Page Title

## Explanation
What is this, in plain language, before any jargon.

## Why it matters
Why this concept exists and what problem it solves — connect it to
something the reader already knows from elsewhere in the hub where possible.

## Learning resources
Links to courses, books, papers, and videos — prefer resources that are
free or have a free tier, and link to the primary source (official docs,
the original paper) over a summary of it when both are available.

## Recommended practice
Concrete exercises to build intuition — not just "read about X," but
"implement X from scratch" or "break X on purpose and observe what happens."

## Projects
A few project ideas, roughly ordered beginner → advanced, that put the
concept to use end-to-end.
```

Section **index pages** (e.g. `machine-learning/index.md`) are shorter — a paragraph of orientation, a bulleted list of the pages in that section with one-line descriptions, and a note on how the section connects to what comes before/after it in the [Roadmap](roadmap.md).

## Style conventions

- Write for someone who has completed [Foundations](foundations/index.md) but nothing else — don't assume prior exposure to the specific topic on the page.
- Prefer concrete, falsifiable claims over hype. If a technique has real limitations or tradeoffs, say so.
- Link to internal pages with relative Markdown links (e.g. `[Model Evaluation](../machine-learning/evaluation.md)`), not absolute URLs — this keeps links working across forks and local builds.
- Avoid unexplained jargon and acronyms on first use — spell it out once (e.g. "Low-Rank Adaptation (LoRA)").
- Keep tone professional and direct; avoid excessive emojis, hype language, or generic "blog post" filler.
- When recommending a resource, prefer free or freely-available material where a comparably good option exists, and note when something requires payment.

## Adding a resource to the library

For a single link (a course, paper, tool, etc.), the fastest path is:

1. Add it to the relevant category in [Resources](resources/index.md), or to a specific topic page's "Learning resources" list if it's narrowly relevant to one topic.
2. Add one line of context — why it's worth including, not just a bare link.
3. Open a pull request titled something like `Add resource: <name>`.

## Reviewing pull requests

Contributions are reviewed for:

- **Accuracy** — is the technical content correct?
- **Fit** — does it belong in this hub, and in the section it's placed in?
- **Structure** — does a new topic page follow the conventions above?

Reviewers should be constructive and specific — this is a teaching resource built by students at different stages, and review comments are themselves a form of teaching.
