// Empty means "same origin" — in production the API and the built client are
// served by the same server, so relative paths keep the session cookie
// first-party. Local dev sets VITE_API_URL (see .env.example) because Vite
// serves the client on a different port than the API.
export const API_URL = import.meta.env.VITE_API_URL || "";

export async function fetchMe() {
  const res = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user;
}

// Page and topic counts for the signed-out landing page.
export async function fetchPublicStats() {
  const res = await fetch(`${API_URL}/api/public/stats`);
  if (!res.ok) throw new Error("stats unavailable");
  return res.json();
}

export function googleLoginUrl() {
  return `${API_URL}/auth/google`;
}

export async function logout() {
  await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// --- Pages ---------------------------------------------------------------

export async function fetchPage(slug) {
  const data = await request(`/api/page?slug=${encodeURIComponent(slug)}`);
  return data.page;
}

// `baseUpdatedAt` is the version the editor started from; the server refuses
// the save if someone else has published since.
export function savePage(slug, body, summary, baseUpdatedAt) {
  return request("/api/edits", {
    method: "POST",
    body: JSON.stringify({ slug, body, summary, baseUpdatedAt }),
  });
}

export async function fetchRevisions(slug) {
  const data = await request(`/api/revisions?slug=${encodeURIComponent(slug)}`);
  return data.revisions;
}

// Recent changes across the whole hub; `mine` limits it to the current member.
export async function fetchChanges(mine = false) {
  const data = await request(`/api/changes${mine ? "?mine=1" : ""}`);
  return data.revisions;
}

export async function fetchDiff(revisionId) {
  return request(`/api/revisions/${revisionId}/diff`);
}

export function revertRevision(id) {
  return request(`/api/revisions/${id}/revert`, { method: "POST" });
}

// --- Members (admin) -----------------------------------------------------

// Returns the viewer's own role alongside the list, so the UI knows which rows
// it is allowed to offer controls for without hardcoding the hierarchy.
export async function fetchMembers() {
  const data = await request("/api/members");
  return { members: data.members, viewerRole: data.viewerRole };
}

export function addMember(name, email, department = "") {
  return request("/api/members", {
    method: "POST",
    body: JSON.stringify({ name, email, department }),
  });
}

export function bulkAddMembers(text, department = "") {
  return request("/api/members/bulk", {
    method: "POST",
    body: JSON.stringify({ text, department }),
  });
}

export function updateMember(id, changes) {
  return request(`/api/members/${id}`, { method: "PATCH", body: JSON.stringify(changes) });
}

// --- Structure: nav, roadmap, page management ----------------------------

export async function fetchNav() {
  const data = await request("/api/nav");
  return data.nav;
}

export async function fetchRoadmap() {
  const data = await request("/api/roadmap");
  return data.stages;
}

export async function fetchAllPages() {
  const data = await request("/api/pages");
  return data.pages;
}

export async function fetchStages() {
  const data = await request("/api/roadmap/stages");
  return data.stages;
}

export function createPage(fields) {
  return request("/api/pages", { method: "POST", body: JSON.stringify(fields) });
}

export function updatePageMeta(id, changes) {
  return request(`/api/pages/${id}`, { method: "PATCH", body: JSON.stringify(changes) });
}

export function deletePage(id, force = false) {
  return request(`/api/pages/${id}${force ? "?force=1" : ""}`, { method: "DELETE" });
}

// --- Contributions -------------------------------------------------------

export async function fetchLeaderboard() {
  return request("/api/leaderboard");
}

// Omit `email` for the signed-in member's own numbers.
export async function fetchMyStats(email) {
  return request(`/api/stats/me${email ? `?email=${encodeURIComponent(email)}` : ""}`);
}

// --- Search, bookmarks, comments ------------------------------------------

export async function searchPages(q, signal) {
  return request(`/api/search?q=${encodeURIComponent(q)}`, { signal });
}

export async function fetchBookmarks() {
  const data = await request("/api/bookmarks");
  return data.bookmarks;
}

export function setBookmark(slug, saved) {
  return saved
    ? request("/api/bookmarks", { method: "PUT", body: JSON.stringify({ slug }) })
    : request(`/api/bookmarks?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
}

export async function fetchComments(slug) {
  const data = await request(`/api/comments?slug=${encodeURIComponent(slug)}`);
  return data.comments;
}

export async function postComment(slug, body, parentId = null) {
  const data = await request("/api/comments", {
    method: "POST",
    body: JSON.stringify({ slug, body, parentId }),
  });
  return data.comment;
}

export async function editComment(id, body) {
  const data = await request(`/api/comments/${id}`, { method: "PATCH", body: JSON.stringify({ body }) });
  return data.comment;
}

export function deleteComment(id) {
  return request(`/api/comments/${id}`, { method: "DELETE" });
}

// --- Admin tools ------------------------------------------------------------

export async function fetchAnnouncement() {
  const data = await request("/api/announcement");
  return data.announcement;
}

export function postAnnouncement(fields) {
  return request("/api/announcements", { method: "POST", body: JSON.stringify(fields) });
}

export function clearAnnouncement() {
  return request("/api/announcements/current", { method: "DELETE" });
}

export function fetchOverview() {
  return request("/api/admin/overview");
}

export function fetchAudit(before) {
  return request(`/api/admin/audit${before ? `?before=${encodeURIComponent(before)}` : ""}`);
}

export async function fetchAllComments() {
  const data = await request("/api/admin/comments");
  return data.comments;
}

export function removeMember(id) {
  return request(`/api/members/${id}`, { method: "DELETE" });
}

export const membersExportUrl = () => `${API_URL}/api/members/export.csv`;
