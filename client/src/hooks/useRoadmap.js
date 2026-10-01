import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { fetchRoadmap, fetchProgress, saveProgress } from "../api";
import { useAuth } from "../context/AuthContext";

// Roadmap progress lives on the member's account, so it follows them across
// devices. A copy is kept in this browser (per account) so the roadmap paints
// instantly and survives a flaky connection; the server is the source of truth.
//
// One shared store means ticking a topic on the home roadmap, the Roadmap page
// or the home banner updates the others at once — and the `storage` event keeps
// other open tabs in step too.
const LEGACY_KEY = "aihub-roadmap-progress";
const keyFor = (email) => `aihub-progress:${email}`;
const EMPTY = Object.freeze({});
const listeners = new Set();

let owner = null;
let snapshot = EMPTY;

function readLocal(email) {
  try {
    return JSON.parse(localStorage.getItem(keyFor(email))) || {};
  } catch {
    return {};
  }
}

function writeLocal(email, value) {
  try {
    localStorage.setItem(keyFor(email), JSON.stringify(value));
  } catch {
    // Private mode or blocked storage: the server copy still has it.
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function set(next) {
  snapshot = next;
  if (owner) writeLocal(owner, next);
  emit();
}

const asFlags = (done) => Object.fromEntries(Object.keys(done || {}).map((k) => [k, true]));

function load(email) {
  if (owner === email) return;
  owner = email;

  // Progress from before it moved to the server sat under one shared key;
  // it's adopted by the first account to sign in on this browser.
  let local = readLocal(email);
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");
    if (legacy) {
      local = { ...Object.fromEntries(Object.entries(legacy).filter(([, v]) => v)), ...local };
      localStorage.removeItem(LEGACY_KEY);
    }
  } catch {
    // Unreadable legacy data is simply skipped.
  }
  snapshot = local;
  emit();

  fetchProgress()
    .then(async (server) => {
      if (owner !== email) return;
      const serverFlags = asFlags(server);
      const onlyHere = Object.keys(local).filter((id) => local[id] && !serverFlags[id]);
      // Merging only ever adds ticks, so it can't undo progress made elsewhere.
      const merged = onlyHere.length ? asFlags(await saveProgress({ merge: Object.fromEntries(onlyHere.map((id) => [id, true])) })) : serverFlags;
      if (owner === email) set(merged);
    })
    .catch(() => {
      // Offline: carry on with the local copy; it syncs on the next load.
    });
}

function subscribe(listener) {
  listeners.add(listener);
  const onStorage = (e) => {
    if (owner && e.key === keyFor(owner)) {
      snapshot = readLocal(owner);
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useRoadmapProgress() {
  const { user } = useAuth();
  const email = user?.email || null;

  useEffect(() => {
    if (email) load(email);
  }, [email]);

  const progress = useSyncExternalStore(subscribe, () => (owner && owner === email ? snapshot : EMPTY));

  const setDone = useCallback((id, done) => {
    const next = { ...snapshot };
    if (done) next[id] = true;
    else delete next[id];
    set(next);
    saveProgress({ id, done }).catch(() => {});
  }, []);

  const reset = useCallback(() => {
    if (!window.confirm("Clear all your roadmap progress? This can't be undone.")) return;
    set({});
    saveProgress({ reset: true }).catch(() => {});
  }, []);

  return { progress, setDone, reset };
}

// The stages change only when an admin edits the structure, so one request is
// shared by every component that shows the roadmap during a visit.
let stagesPromise = null;

export function useRoadmapStages() {
  const [stages, setStages] = useState(null);
  useEffect(() => {
    let cancelled = false;
    stagesPromise ??= fetchRoadmap().catch((err) => {
      stagesPromise = null;
      throw err;
    });
    stagesPromise
      .then((s) => !cancelled && setStages(s))
      .catch(() => !cancelled && setStages([]));
    return () => {
      cancelled = true;
    };
  }, []);
  return stages;
}

export function countDone(nodes, progress) {
  return nodes.reduce((n, node) => n + (progress[node.id] ? 1 : 0), 0);
}

// roadmap hrefs look like "foundations/python/" — strip the trailing slash and
// add a leading one to match the app's routes.
export function toRoute(href) {
  return "/" + href.replace(/\/+$/, "");
}
