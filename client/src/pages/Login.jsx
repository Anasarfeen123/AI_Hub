import { useEffect, useState } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { googleLoginUrl, fetchPublicStats, requestAccess } from "../api";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import useDocumentTitle from "../hooks/useDocumentTitle";
import hubMark from "../assets/hub-mark.png";
import Wordmark from "../components/Wordmark";

// The learning path is the product, so the landing page shows the actual
// sequence rather than describing it in prose.
const PATH = [
  { label: "Foundations", detail: "Python, maths, statistics, optimization", level: "beginner" },
  { label: "Machine Learning", detail: "Algorithms, evaluation, first projects", level: "intermediate" },
  { label: "Deep Learning", detail: "CNNs, transformers, frameworks", level: "intermediate" },
  { label: "Specializations", detail: "CV, NLP, GenAI, RL, MLOps, research", level: "advanced" },
];

const icon = (d) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const FEATURES = [
  {
    title: "A sequence, not a pile of links",
    body: "Every topic builds on the one before it, so you always know what to learn next and why it matters now.",
    icon: icon(<path d="M4 6h10M4 12h16M4 18h7M17 4l3 2-3 2" />),
  },
  {
    title: "Track your progress",
    body: "Tick topics off as you finish them and watch each stage fill up, right on the roadmap.",
    icon: icon(<><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>),
  },
  {
    title: "Search everything",
    body: "Press / anywhere and find any topic, resource or explanation across every page in a keystroke.",
    icon: icon(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
  },
  {
    title: "Ask and discuss",
    body: "Every page has its own thread. Ask a question, share a better resource, help the next person.",
    icon: icon(<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />),
  },
  {
    title: "Anyone can improve it",
    body: "Spot a gap? Hit Edit and publish. No pull requests, no approval queue. Every member can write.",
    icon: icon(<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>),
  },
  {
    title: "Nothing is ever lost",
    body: "Every save is versioned. Leads review changes and can restore any earlier version in one click.",
    icon: icon(<><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>),
  },
];

const SOCIALS = [
  {
    label: "Website",
    href: "https://www.microsoftinnovations.club/",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9s1.3-6.5 3.8-9z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/microsoft.innovations.vitc",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/microsoft-innovations-club-vitc/posts/?feedView=all",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="7.5" y1="10.5" x2="7.5" y2="16.5" />
        <circle cx="7.5" cy="7.3" r="0.9" fill="currentColor" stroke="none" />
        <path d="M11.5 16.5v-4c0-1.4 1-2.2 2.2-2.2 1.2 0 2 .8 2 2.2v4" />
      </svg>
    ),
  },
];

function GoogleButton({ large = false }) {
  return (
    <a className={`google-signin-btn${large ? " google-signin-btn--lg" : ""}`} href={googleLoginUrl()}>
      <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.9 5.1 29.7 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z" />
        <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.9 5.1 29.7 3 24 3c-7.4 0-13.8 4-17.3 9.9z" />
        <path fill="#4CAF50" d="M24 45c5.6 0 10.7-1.9 14.6-5.2l-6.7-5.7c-2 1.4-4.7 2.4-7.9 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.9 40.9 16.4 45 24 45z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.7 5.7C41.7 36 45 30.7 45 24c0-1.4-.1-2.7-.4-3.5z" />
      </svg>
      Continue with Google
    </a>
  );
}

// A small, static picture of the signed-in hub: what a member is about to get.
// Built from markup rather than a screenshot so it stays crisp and follows the
// theme.
function HubPreview({ stats }) {
  const stages = [
    { label: "Beginner", title: "Foundations", done: 3, total: 4, level: "beginner" },
    { label: "Intermediate", title: "Core Toolbox", done: 2, total: 5, level: "intermediate" },
    { label: "Advanced", title: "Specialize & Research", done: 0, total: 4, level: "advanced" },
  ];
  return (
    <div className="lp-preview" aria-hidden="true">
      <div className="lp-preview-bar">
        <span className="lp-preview-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="lp-preview-search">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          transformers
          <kbd>/</kbd>
        </span>
      </div>
      <div className="lp-preview-body">
        <p className="lp-preview-kicker">Your roadmap</p>
        <p className="lp-preview-total">
          <strong>5</strong> of {stats?.topics || 13} topics done
        </p>
        {stages.map((s) => (
          <div className={`lp-preview-stage lp-preview-stage--${s.level}`} key={s.title}>
            <div className="lp-preview-stage-top">
              <span className="lp-preview-badge">{s.label}</span>
              <span className="lp-preview-count">
                {s.done}/{s.total}
              </span>
            </div>
            <strong>{s.title}</strong>
            <span className="lp-preview-track">
              <span style={{ width: `${(s.done / s.total) * 100}%` }} />
            </span>
          </div>
        ))}
        <div className="lp-preview-comment">
          <span className="lp-preview-avatar">RM</span>
          <span>
            <strong>Ravi</strong> CS231n's notes made CNNs click for me — start with lecture 5.
          </span>
        </div>
      </div>
    </div>
  );
}

// "Request access" for people not on the list yet. Goes to the leads, who
// approve it from the Members page. The hidden "website" field is a trap for
// bots; people never see it.
function RequestAccess({ initialEmail, onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail || "");
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState({ busy: false, done: false, error: null });

  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, done: false, error: null });
    try {
      await requestAccess({ name, email, note, website });
      setState({ busy: false, done: true, error: null });
    } catch (err) {
      setState({ busy: false, done: false, error: err.message });
    }
  }

  if (state.done) {
    return (
      <div className="lp-request lp-request--done" role="status">
        <strong>Request sent ✉️</strong>
        <p>
          A lead will review it soon. Once you're approved, sign in with Google using <b>{email}</b>.
        </p>
        <button type="button" className="link-btn" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  return (
    <form className="lp-request" onSubmit={submit}>
      <div className="lp-request-head">
        <strong>Request access</strong>
        <button type="button" className="lp-request-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <p className="lp-request-hint">For MIC members not on the list yet. Use the Google account you'll sign in with — ideally your VIT email.</p>
      <label>
        <span>Your name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} autoComplete="name" />
      </label>
      <label>
        <span>Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} autoComplete="email" placeholder="you@vitstudent.ac.in" />
      </label>
      <label>
        <span>
          Anything we should know? <em>(optional)</em>
        </span>
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="e.g. 1st year, joined the AI/ML vertical this semester" />
      </label>
      <label className="lp-request-trap" aria-hidden="true">
        Website
        <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </label>
      {state.error && <p className="comment-error">{state.error}</p>}
      <button type="submit" className="btn btn--primary" disabled={state.busy}>
        {state.busy ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}

export default function Login() {
  useDocumentTitle("");
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const denied = params.get("error") === "not_allowed";
  const deniedEmail = params.get("email") || "";
  const [requesting, setRequesting] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchPublicStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  if (!loading && user) return <Navigate to="/" replace />;

  return (
    <div className="lp">
      <div className="lp-backdrop" aria-hidden="true">
        <span className="lp-glow lp-glow--a" />
        <span className="lp-glow lp-glow--b" />
        <span className="lp-glow lp-glow--c" />
        <span className="lp-grid" />
      </div>

      <header className="lp-topbar">
        <a className="lp-topbar-brand" href="#top" aria-label="AIML Resource Hub">
          <img src={hubMark} alt="" width="40" height="30" />
          <span className="lp-topbar-words">
            <Wordmark />
            <small>by Microsoft Innovations Club · VIT Chennai</small>
          </span>
        </a>
        <div className="lp-topbar-actions">
          <ThemeToggle />
          <a className="lp-topbar-signin" href={googleLoginUrl()}>
            Sign in
          </a>
        </div>
      </header>

      <main id="main" className="lp-main">
        {/* --- Hero ------------------------------------------------------- */}
        <section className="lp-hero" id="top">
          <div className="lp-hero-copy">
            <p className="lp-pill">
              <span className="lp-pill-dot" aria-hidden="true" />
              MIC AI/ML · VIT Chennai · Members only
            </p>
            <h1>
              {/* The space matters: phones hide the <br>, and without it the two
                  lines would run together as "orderit". */}
              Learn AI in the order{" "}
              <br />
              it <span className="lp-accent">actually makes sense.</span>
            </h1>
            <p className="lp-lede">
              One clear path from your first line of Python to reading (and writing) research
              papers. Put together by MIC leads, made better by every member.
            </p>

            {denied && (
              <div className="lp-alert" role="alert">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5M12 16h.01" />
                </svg>
                <div>
                  <strong>{deniedEmail ? `${deniedEmail} isn't on the member list.` : "That account isn't on the member list."}</strong>
                  <p>
                    Try the Google account you registered with MIC — often your VIT email. Still stuck?{" "}
                    <button type="button" className="link-btn" onClick={() => setRequesting(true)}>
                      Request access
                    </button>{" "}
                    and a lead will add you.
                  </p>
                </div>
              </div>
            )}

            <div className="lp-cta">
              <GoogleButton large />
              <p className="lp-cta-note">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="4" y="11" width="16" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                Use your MIC-registered Google account ·{" "}
                <button type="button" className="link-btn" onClick={() => setRequesting(true)}>
                  Not on the list?
                </button>
              </p>
              {requesting && <RequestAccess initialEmail={deniedEmail} onClose={() => setRequesting(false)} />}
            </div>

            {/* Real counts from the server; the row simply stays hidden if
                they can't be fetched, rather than showing made-up numbers. */}
            {stats && (
              <ul className="lp-facts">
                <li>
                  <strong>{stats.stages}</strong> stages
                </li>
                <li>
                  <strong>{stats.topics}</strong> roadmap topics
                </li>
                <li>
                  <strong>{stats.pages}</strong> pages to learn from
                </li>
              </ul>
            )}
          </div>

          <HubPreview stats={stats} />
        </section>

        {/* --- The path ---------------------------------------------------- */}
        <section className="lp-section" aria-labelledby="lp-path-title">
          <p className="lp-kicker">The path</p>
          <h2 className="lp-h2" id="lp-path-title">
            Four stages, each one built on the last.
          </h2>
          <ol className="lp-path">
            {PATH.map((step, i) => (
              <li key={step.label} className={`lp-path-step lp-path-step--${step.level}`}>
                <span className="lp-path-num">{String(i + 1).padStart(2, "0")}</span>
                <strong>{step.label}</strong>
                <span>{step.detail}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* --- Features ---------------------------------------------------- */}
        <section className="lp-section" aria-labelledby="lp-features-title">
          <p className="lp-kicker">Why this exists</p>
          <h2 className="lp-h2" id="lp-features-title">
            Everything you need to actually learn it, in one place.
          </h2>
          <div className="lp-features">
            {FEATURES.map((f) => (
              <div className="lp-feature" key={f.title}>
                <span className="lp-feature-icon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* --- Closing call to action ------------------------------------- */}
        <section className="lp-final">
          <img src={hubMark} alt="" width="96" height="72" />
          <h2>Ready when you are.</h2>
          <p>Sign in with your MIC Google account and pick up right where you left off.</p>
          <GoogleButton large />
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <p className="lp-footer-note">
            © {new Date().getFullYear()} Microsoft Innovations Club — VIT Chennai · Built and maintained by the AI/ML vertical
          </p>
          <div className="lp-footer-socials">
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} title={s.label}>
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
