import { memo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { Link } from "react-router-dom";
import { renderBody } from "../lib/content";
import { API_URL } from "../api";
import { usePageContext } from "../context/PageContext";
import HelpfulButton from "./HelpfulButton";

// Links inside a list are the page's resources ("Learning resources",
// "Recommended practice"); a link in running prose is just a reference. This
// tiny rehype step marks the first kind, so only they get a "helped me" button.
function markResourceLinks() {
  const walk = (node, inList) => {
    if (node.type === "element") {
      if (node.tagName === "a" && inList && /^https?:\/\//i.test(node.properties?.href || "")) {
        node.properties.dataResource = "1";
      }
      const nowInList = inList || node.tagName === "li";
      for (const child of node.children || []) walk(child, nowInList);
    } else if (node.children) {
      for (const child of node.children) walk(child, inList);
    }
  };
  return (tree) => walk(tree, false);
}

// Links inside page content come in three flavours and each needs different
// handling, so they're routed here rather than all becoming plain anchors:
//
//   /deep-learning/cnn   another hub page  -> React Router, no page reload
//   #section             same page         -> plain anchor, no new tab
//   https://…            the outside world -> new tab, so the hub isn't lost
function MarkdownLink({ href = "", children, node: _node, "data-resource": resource, ...props }) {
  const page = usePageContext();
  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <Link to={href} {...props}>
        {children}
      </Link>
    );
  }
  if (href.startsWith("#")) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }
  return (
    <>
      <a href={href} target="_blank" rel="noreferrer" {...props}>
        {children}
      </a>
      {resource && page?.ratings && <HelpfulButton url={href} />}
    </>
  );
}

// "Copy" on every code block: the most common thing anyone does with one.
function CodeBlock({ children, node: _node, ...props }) {
  const ref = useRef(null);
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(ref.current?.innerText || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="code-block">
      <pre ref={ref} {...props}>
        {children}
      </pre>
      <button type="button" className="code-copy" onClick={copy} aria-label="Copy code">
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

// Section headings get a link button that copies the URL to that section, so
// "see the bit about attention" can point at exactly that bit.
function sectionHeading(Tag) {
  return function Heading({ id, children, node: _node, ...props }) {
    const [copied, setCopied] = useState(false);
    const page = usePageContext();
    async function share() {
      const url = `${window.location.origin}${window.location.pathname}#${id}`;
      try {
        await navigator.clipboard.writeText(url);
        window.history.replaceState(null, "", `#${id}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        window.location.hash = id;
      }
    }
    return (
      <Tag id={id} {...props}>
        {children}
        {id && page && (
          <button
            type="button"
            className={`heading-link${copied ? " is-copied" : ""}`}
            onClick={share}
            aria-label={`Copy a link to "${typeof children === "string" ? children : "this section"}"`}
            title="Copy link to this section"
          >
            {copied ? "Link copied" : "#"}
          </button>
        )}
      </Tag>
    );
  };
}

// Uploaded images live at /api/images/…, served by the API — the same origin
// in production, a different port in local development.
function LazyImage({ node: _node, alt = "", src = "", ...props }) {
  const resolved = src.startsWith("/api/") ? `${API_URL}${src}` : src;
  return <img alt={alt} src={resolved} loading="lazy" decoding="async" {...props} />;
}

const components = {
  a: MarkdownLink,
  pre: CodeBlock,
  h2: sectionHeading("h2"),
  h3: sectionHeading("h3"),
  img: LazyImage,
};
const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeSlug, markResourceLinks];

// Memoised: re-parsing a long article whenever an unrelated piece of page
// state changes (a comment posted, a bookmark toggled) is wasted work.
function Markdown({ body, linkBase }) {
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>
      {renderBody(body, linkBase)}
    </ReactMarkdown>
  );
}

export default memo(Markdown);
