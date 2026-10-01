import { createContext, useContext } from "react";

// Per-page extras the article renderer can use when it's showing a real page
// (not the editor preview or a comment): which page it is, and resource
// ratings. Absent means "plain rendering".
export const PageContext = createContext(null);

export function usePageContext() {
  return useContext(PageContext);
}
