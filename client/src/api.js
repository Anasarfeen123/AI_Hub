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

// The roadmap's outline (stage and topic titles) for the signed-out landing page.
export async function fetchPublicRoadmap() {
  const res = await fetch(`${API_URL}/api/public/roadmap`);
  if (!res.ok) throw new Error("roadmap unavailable");
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

// --- Personal: progress, reading, notes, profile -----------------------------

export async function fetchProgress() {
  return (await request("/api/me/progress")).done;
}

export async function saveProgress(body) {
  return (await request("/api/me/progress", { method: "PUT", body: JSON.stringify(body) })).done;
}

// keepalive lets the last scroll position save even as the tab closes.
export function recordReading(slug, scroll, view = false) {
  return fetch(`${API_URL}/api/me/reading`, {
    method: "POST",
    credentials: "include",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scroll === null ? { slug, view } : { slug, scroll, view }),
  }).catch(() => {});
}

export async function fetchRecent() {
  return (await request("/api/me/recent")).recent;
}

export function fetchReadingPosition(slug) {
  return request(`/api/me/reading?slug=${encodeURIComponent(slug)}`);
}

export async function fetchNote(slug) {
  return (await request(`/api/me/notes?slug=${encodeURIComponent(slug)}`)).note;
}

export async function fetchNotes() {
  return (await request("/api/me/notes")).notes;
}

export async function saveNote(slug, body) {
  return (await request("/api/me/notes", { method: "PUT", body: JSON.stringify({ slug, body }) })).note;
}

export function fetchProfile() {
  return request("/api/me/profile");
}

export async function saveSettings(changes) {
  return (await request("/api/me/settings", { method: "PATCH", body: JSON.stringify(changes) })).settings;
}

export function fetchPeers() {
  return request("/api/peers");
}

// --- Notifications ----------------------------------------------------------------

export function fetchNotifications() {
  return request("/api/me/notifications");
}

export async function fetchUnreadCount() {
  return (await request("/api/me/notifications/count")).unread;
}

export function markNotificationsRead(id) {
  return request("/api/me/notifications/read", { method: "POST", body: JSON.stringify(id ? { id } : {}) });
}

// --- Community: ratings, flags, suggestions, access ---------------------------------

export async function fetchRatings(slug) {
  return (await request(`/api/ratings?slug=${encodeURIComponent(slug)}`)).ratings;
}

export function rateLink(slug, url, helpful) {
  return request("/api/ratings", { method: "POST", body: JSON.stringify({ slug, url, helpful }) });
}

export async function fetchFlags(slug) {
  return (await request(`/api/flags${slug ? `?slug=${encodeURIComponent(slug)}` : ""}`)).flags;
}

export function raiseFlag(slug, kind, note) {
  return request("/api/flags", { method: "POST", body: JSON.stringify({ slug, kind, note }) });
}

export function resolveFlag(id) {
  return request(`/api/flags/${id}/resolve`, { method: "POST" });
}

export function suggestEdit(slug, body, summary, baseUpdatedAt) {
  return request("/api/suggestions", { method: "POST", body: JSON.stringify({ slug, body, summary, baseUpdatedAt }) });
}

export async function fetchMySuggestions() {
  return (await request("/api/suggestions/mine")).suggestions;
}

export async function fetchSuggestions(status = "pending") {
  return (await request(`/api/suggestions?status=${status}`)).suggestions;
}

export function reviewSuggestion(id, decision, note) {
  return request(`/api/suggestions/${id}/${decision}`, { method: "POST", body: JSON.stringify({ note }) });
}

export function requestAccess(fields) {
  return request("/api/access-requests", { method: "POST", body: JSON.stringify(fields) });
}

export async function fetchAccessRequests() {
  return (await request("/api/access-requests")).requests;
}

export function decideAccessRequest(id, decision) {
  return request(`/api/access-requests/${id}/${decision}`, { method: "POST" });
}

// --- Images ----------------------------------------------------------------------------

export async function uploadImage(file, slug) {
  const res = await fetch(`${API_URL}/api/images?slug=${encodeURIComponent(slug || "")}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
  return data.url;
}

// --- Admin: analytics, links, reminders, history ------------------------------------------

export function fetchAnalytics(days = 30) {
  return request(`/api/admin/analytics?days=${days}`);
}

export function fetchLinkReport() {
  return request("/api/admin/links");
}

export function startLinkCheck() {
  return request("/api/admin/links/check", { method: "POST" });
}

export function fetchReminders() {
  return request("/api/admin/reminders");
}

export function sendReminders() {
  return request("/api/admin/reminders/send", { method: "POST" });
}

export async function fetchAnnouncementHistory() {
  return (await request("/api/announcements")).announcements;
}
