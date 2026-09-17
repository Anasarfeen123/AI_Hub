import { useSearchParams, Navigate } from "react-router-dom";
import { googleLoginUrl } from "../api";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import micLogo from "../assets/mic-logo.png";

// The learning path is the product, so the landing page shows the actual
// sequence rather than describing it in prose.
const PATH = [
  { label: "Foundations", detail: "Python, maths, statistics, optimization" },
  { label: "Machine Learning", detail: "Algorithms, evaluation, first projects" },
  { label: "Deep Learning", detail: "CNNs, transformers, frameworks" },
  { label: "Specializations", detail: "CV, NLP, GenAI, RL, MLOps, research" },
];

const PILLARS = [
  {
    title: "A sequence, not a pile of links",
    body: "Every topic builds on the one before it, so you always know what to learn next and why it matters now.",
  },
  {
    title: "Anyone can improve it",
    body: "Spot a gap or a better explanation? Hit edit and publish. No pull request, no approval queue — every member has write access.",
  },
  {
    title: "Kept current by leads",
    body: "Written and maintained by the AI/ML vertical, with full revision history on every page so nothing is lost.",
  },
];

const SOCIALS = [
  {
    label: "Website",
    href: "https://www.microsoftinnovations.club/",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9s1.3-6.5 3.8-9z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/microsoft.innovations.vitc",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
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
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="7.5" y1="10.5" x2="7.5" y2="16.5" />
        <circle cx="7.5" cy="7.3" r="0.9" fill="currentColor" stroke="none" />
        <path d="M11.5 16.5v-4c0-1.4 1-2.2 2.2-2.2 1.2 0 2 .8 2 2.2v4" />
      </svg>
    ),
  },
];

function GoogleButton() {
  return (
    <a className="google-signin-btn" href={googleLoginUrl()}>
      <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.9 5.1 29.7 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z" />
        <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.9 5.1 29.7 3 24 3c-7.4 0-13.8 4-17.3 9.9z" />
        <path fill="#4CAF50" d="M24 45c5.6 0 10.7-1.9 14.6-5.2l-6.7-5.7c-2 1.4-4.7 2.4-7.9 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.9 40.9 16.4 45 24 45z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.7 5.7C41.7 36 45 30.7 45 24c0-1.4-.1-2.7-.4-3.5z" />
      </svg>
      Sign in with Google
    </a>
  );
}

export default function Login() {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const denied = params.get("error") === "not_allowed";

  if (!loading && user) return <Navigate to="/" replace />;

  return (
    <div className="lp">
      <div className="lp-watermark" aria-hidden="true" />

      <header className="lp-topbar">
        <div className="lp-topbar-brand">
          <img src={micLogo} alt="" width="26" />
          <span>Microsoft Innovations Club</span>
        </div>
        <div className="lp-topbar-actions">
          <ThemeToggle />
          <a className="lp-topbar-signin" href={googleLoginUrl()}>
            Sign in
          </a>
        </div>
      </header>

      <main className="lp-main">
        {/* --- Hero ------------------------------------------------------- */}
        <section className="lp-hero">
          <p className="lp-eyebrow">AI/ML Vertical · VIT Chennai</p>
          <h1>
            Learn AI in the order
            <br />
            it actually makes sense.
          </h1>
          <p className="lp-lede">
            The Microsoft Innovations Club's AI/ML Resource Hub — one maintained path from your
            first line of Python to reading and writing research papers.
          </p>

          {denied && (
            <p className="login-error lp-error" role="alert">
              That account isn't on the current MIC AI/ML member list. If you're a member and think
              this is wrong, ask a lead to add the email you signed in with.
            </p>
          )}

          <div className="lp-cta">
            <GoogleButton />
            <p className="lp-cta-note">Members only · use your MIC-registered email</p>
          </div>

        </section>

        {/* --- The path ---------------------------------------------------- */}
        <section className="lp-section">
          <h2 className="lp-h2">The path</h2>
          <ol className="lp-path">
            {PATH.map((step, i) => (
              <li key={step.label}>
                <span className="lp-path-num">{i + 1}</span>
                <span className="lp-path-body">
                  <strong>{step.label}</strong>
                  <span>{step.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* --- Why ---------------------------------------------------------- */}
        <section className="lp-section">
          <h2 className="lp-h2">Why this exists</h2>
          <div className="lp-pillars">
            {PILLARS.map((p) => (
              <div className="lp-pillar" key={p.title}>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      <footer className="lp-footer">
        <div className="lp-footer-socials">
          {SOCIALS.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
              {s.icon}
              <span>{s.label}</span>
            </a>
          ))}
        </div>
        <p className="lp-footer-note">
          Microsoft Innovations Club — VIT Chennai · Built and maintained by the AI/ML vertical
        </p>
      </footer>
    </div>
  );
}
