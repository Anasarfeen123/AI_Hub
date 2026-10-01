import { useEffect, useState } from "react";

// "On this page" for long articles. Built from the rendered headings (whose
// ids come from rehype-slug) so it always matches what's on screen, and it
// highlights the section currently being read.
export default function TableOfContents({ containerRef, page }) {
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;
    const headings = [...root.querySelectorAll(".md-body h2[id], .md-body h3[id]")];
    setItems(headings.map((h) => ({ id: h.id, text: h.textContent, level: h.tagName === "H3" ? 3 : 2 })));
    if (headings.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      // Treat the band just under the sticky header as "being read".
      { rootMargin: "-120px 0px -65% 0px" }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [containerRef, page]);

  if (items.length < 3) return null;

  return (
    <nav className="toc" aria-label="On this page">
      <p className="toc-title">On this page</p>
      <ul>
        {items.map((item) => (
          <li key={item.id} className={`toc-l${item.level}`}>
            <a href={`#${item.id}`} className={item.id === activeId ? "is-active" : ""}>
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
