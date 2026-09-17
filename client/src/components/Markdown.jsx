import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { Link } from "react-router-dom";
import { renderBody } from "../lib/content";

// Links inside page content come in three flavours and each needs different
// handling, so they're routed here rather than all becoming plain anchors:
//
//   /deep-learning/cnn   another hub page  -> React Router, no page reload
//   #section             same page         -> plain anchor, no new tab
//   https://…            the outside world -> new tab, so the hub isn't lost
function MarkdownLink({ href = "", children, ...props }) {
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
    <a href={href} target="_blank" rel="noreferrer" {...props}>
      {children}
    </a>
  );
}

const components = { a: MarkdownLink };

export default function Markdown({ body, linkBase }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]} components={components}>
      {renderBody(body, linkBase)}
    </ReactMarkdown>
  );
}
