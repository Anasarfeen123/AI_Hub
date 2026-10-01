import { useEffect } from "react";

const SITE = "AIML Resource Hub";

// Tabs and history entries named after the page rather than all reading the
// same site title.
export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : `${SITE} — MIC VIT Chennai`;
  }, [title]);
}
