import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { fetchPublicRoadmap } from "../api";
import homeDark from "../assets/landing/home-dark.webp";
import homeLight from "../assets/landing/home-light.webp";
import topicDark from "../assets/landing/topic-dark.webp";
import topicLight from "../assets/landing/topic-light.webp";
import searchDark from "../assets/landing/search-dark.webp";
import searchLight from "../assets/landing/search-light.webp";
import discussDark from "../assets/landing/discuss-dark.webp";
import discussLight from "../assets/landing/discuss-light.webp";

// Screenshots of the real hub, taken with an invented demo student so no
// member's data appears on a public page. Each exists in both themes and only
// the one being shown is ever downloaded.
const SHOTS = {
  home: { dark: homeDark, light: homeLight },
  topic: { dark: topicDark, light: topicLight },
  search: { dark: searchDark, light: searchLight },
  discuss: { dark: discussDark, light: discussLight },
};

function BrowserFrame({ src, alt, eager = false }) {
  return (
    <div className="lp-frame">
      <div className="lp-frame-bar" aria-hidden="true">
        <span className="lp-frame-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="lp-frame-url">mic-aiml-resource-hub.onrender.com</span>
      </div>
      <img src={src} alt={alt} width="1280" height="800" loading={eager ? "eager" : "lazy"} decoding="async" />
    </div>
  );
}

// --- Hero: the real app, with a few live-looking moments around it ----------------

export function HeroShot() {
  const { resolved } = useTheme();
  return (
    <div className="lp-hero-shot">
      <BrowserFrame src={SHOTS.home[resolved]} alt="The hub's home page: progress, what's up next, and pages to continue" eager />
      <div className="lp-chip lp-chip--streak" aria-hidden="true">
        <span>🔥</span>
        <span>
          <strong>4-week streak</strong>
          <small>Keep it going</small>
        </span>
      </div>
      <div className="lp-chip lp-chip--done" aria-hidden="true">
        <span className="lp-chip-check">✓</span>
        <span>
          <strong>Mathematics</strong>
          <small>Topic complete</small>
        </span>
      </div>
      <div className="lp-chip lp-chip--reply" aria-hidden="true">
        <span>💬</span>
        <span>
          <strong>Arjun replied</strong>
          <small>“Start with a random forest…”</small>
        </span>
      </div>
    </div>
  );
}

// --- The roadmap, straight from the hub --------------------------------------------

const FALLBACK = [
  { title: "Foundations", label: "Stage 1 · Beginner", level: "beginner", duration: "6–10 weeks", goal: "Be comfortable writing code and reading the maths every ML paper assumes.", topics: ["Python for AI", "Mathematics", "Statistics", "Optimization"].map((title) => ({ title })) },
  { title: "Core Toolbox", label: "Stage 2 · Intermediate", level: "intermediate", duration: "3–6 months", goal: "Understand the full ML lifecycle — framing, data, model, evaluation, iteration.", topics: ["Machine Learning", "Deep Learning", "Computer Vision", "NLP", "Projects"].map((title) => ({ title })) },
  { title: "Specialize & Research", label: "Stage 3 · Advanced", level: "advanced", duration: "Open-ended", goal: "Go from using models to understanding — and contributing to — the frontier.", topics: ["Generative AI", "Reinforcement Learning", "Specializations", "Research"].map((title) => ({ title })) },
];

export function RoadmapOutline() {
  const [stages, setStages] = useState(FALLBACK);

  useEffect(() => {
    fetchPublicRoadmap()
      .then((d) => d.stages?.length && setStages(d.stages))
      .catch(() => {});
  }, []);

  return (
    <ol className="lp-roadmap">
      {stages.map((s, i) => (
        <li key={s.title} className={`lp-stage lp-stage--${s.level} reveal`} style={{ "--delay": `${i * 90}ms` }}>
          <div className="lp-stage-head">
            <span className="lp-stage-label">{s.label}</span>
            {s.duration && <span className="lp-stage-time">{s.duration}</span>}
          </div>
          <h3>{s.title}</h3>
          {s.goal && <p className="lp-stage-goal">{s.goal}</p>}
          <ul className="lp-stage-topics">
            {s.topics.map((t, j) => (
              <li key={t.title}>
                <span className="lp-stage-n">{j + 1}</span>
                <span>
                  <strong>{t.title}</strong>
                  {t.desc && <small>{t.desc}</small>}
                </span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

// --- A look inside --------------------------------------------------------------

const TOUR = [
  {
    key: "home",
    tab: "Your roadmap",
    title: "Always know what's next",
    body: "Your progress, your streak and the next topic to tackle — the moment you sign in. Pick up any page right where you stopped reading.",
    points: ["Progress follows you to any device", "Weekly streaks and badges", "Saved pages and private notes"],
  },
  {
    key: "topic",
    tab: "Topic pages",
    title: "Explanations first, then the best resources",
    body: "Every topic explains the idea, why it matters, the resources worth your time, and projects to try — written and kept current by the club.",
    points: ["“Helped me” votes surface the best links", "Edit anything; every save is versioned", "Contents sidebar and reading time"],
  },
  {
    key: "search",
    tab: "Search",
    title: "Find anything in a keystroke",
    body: "Press / anywhere to search every page's title and text, with highlighted matches and full keyboard control.",
    points: ["Searches every page instantly", "Keyboard shortcuts for everything", "Installable, and works offline"],
  },
  {
    key: "discuss",
    tab: "Discussion",
    title: "Learn with the people around you",
    body: "Every page has its own thread. Ask what tripped you up, share a better resource, and get a notification when someone answers.",
    points: ["Replies notify you instantly", "See who's on the same stage (opt-in)", "Flag a page that needs work"],
  },
];

export function ProductTour() {
  const { resolved } = useTheme();
  const [active, setActive] = useState("home");
  const item = TOUR.find((t) => t.key === active);

  function onKey(e) {
    const i = TOUR.findIndex((t) => t.key === active);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = TOUR[(i + (e.key === "ArrowRight" ? 1 : TOUR.length - 1)) % TOUR.length];
      setActive(next.key);
      document.getElementById(`lp-tab-${next.key}`)?.focus();
    }
  }

  return (
    <div className="lp-tour">
      <div className="lp-tour-tabs" role="tablist" aria-label="Parts of the hub" onKeyDown={onKey}>
        {TOUR.map((t) => (
          <button
            key={t.key}
            id={`lp-tab-${t.key}`}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            aria-controls="lp-tour-panel"
            tabIndex={active === t.key ? 0 : -1}
            className={active === t.key ? "active" : ""}
            onClick={() => setActive(t.key)}
          >
            {t.tab}
          </button>
        ))}
      </div>
      <div className="lp-tour-body" id="lp-tour-panel" role="tabpanel" aria-labelledby={`lp-tab-${active}`}>
        <div className="lp-tour-copy" key={`copy-${active}`}>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
          <ul>
            {item.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <div className="lp-tour-shot" key={`shot-${active}-${resolved}`}>
          <BrowserFrame src={SHOTS[active][resolved]} alt={`${item.tab}: ${item.title}`} />
        </div>
      </div>
    </div>
  );
}

// --- How it works ------------------------------------------------------------------

const STEPS = [
  { n: "1", title: "Sign in with Google", body: "Use the account on the MIC member list — usually your VIT email. Not on it yet? Request access in one click." },
  { n: "2", title: "Follow the path", body: "Start at Foundations and tick topics off as you go. The hub keeps your place, your streak and your notes." },
  { n: "3", title: "Make it better", body: "Found a better resource or a clearer explanation? Edit the page or start a discussion — it's everyone's hub." },
];

export function HowItWorks() {
  return (
    <ol className="lp-steps">
      {STEPS.map((s, i) => (
        <li key={s.n} className="lp-step reveal" style={{ "--delay": `${i * 90}ms` }}>
          <span className="lp-step-n">{s.n}</span>
          <h3>{s.title}</h3>
          <p>{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

// --- FAQ -----------------------------------------------------------------------------

const FAQ = [
  ["Who can join?", "Members of the Microsoft Innovations Club at VIT Chennai. Sign in with the Google account your email is registered under — usually your VIT address. If it isn't accepted, use “Not on the list?” to request access and a lead will add you."],
  ["Is it free?", "Yes. It's built and run by the club for its members, with no paid parts."],
  ["Do I need to know any AI or programming already?", "No. The first stage starts with Python and the maths you need, and every topic builds on the ones before it."],
  ["How long does the whole path take?", "Foundations takes most people 6–10 weeks, the core toolbox 3–6 months, and the advanced stage is open-ended — go as deep as you like, at your own pace."],
  ["Can I really edit the pages?", "Yes — every member can. Publish straight away or send your edit for review first. Every version is saved, so nothing can be lost."],
  ["Is my progress private?", "Your progress, notes and reading history are yours. Other members only see your name and stage if you opt in to “Learning alongside you”, and you can turn that off any time."],
];

export function Faq() {
  return (
    <div className="lp-faq">
      {FAQ.map(([q, a]) => (
        <details key={q} className="lp-faq-item">
          <summary>
            {q}
            <span className="lp-faq-icon" aria-hidden="true" />
          </summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}
