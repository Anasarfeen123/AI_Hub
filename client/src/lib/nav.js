// Finds a page and its parent section — used for sidebars and page titles.
export function findInNav(nav, path) {
  const clean = (path || "").replace(/^\/+|\/+$/g, "");
  for (const section of nav) {
    if (section.path === clean) return { section, page: section };
    for (const child of section.children || []) {
      if (child.path === clean) return { section, page: child };
    }
  }
  return null;
}
