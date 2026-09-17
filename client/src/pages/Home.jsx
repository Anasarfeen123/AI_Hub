import Header from "../components/Header";
import TopNav from "../components/TopNav";
import Roadmap from "../components/Roadmap";
import AdminBar from "../components/AdminBar";
import micLogo from "../assets/mic-logo.png";

export default function Home() {
  return (
    <>
      <Header />
      <AdminBar />
      <TopNav />
      <div className="hub-hero">
        <img src={micLogo} alt="MIC logo" width="88" />
        <span className="hub-eyebrow">Microsoft Innovations Club — VIT Chennai</span>
        <h1>AI/ML Resource Hub</h1>
        <p>
          A single, maintained place to learn Artificial Intelligence — from your first line of
          Python to reading and writing research papers. Members-only, built and kept current by
          MIC leads.
        </p>
      </div>

      <div className="hub-section">
        <h2 id="your-roadmap">Your Roadmap</h2>
        <p className="roadmap-credit">Designed by the AI/ML Vertical Lead for MIC members.</p>
        <p style={{ color: "var(--fg-light)", marginBottom: "1.25rem" }}>
          Click any node to jump straight to that topic, or check it off as you track your own
          progress — saved right in your browser.
        </p>
        <Roadmap />
      </div>
    </>
  );
}
