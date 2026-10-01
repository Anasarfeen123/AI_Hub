import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { fetchRoadmap } from "../api";

// Progress lives in this browser only. One shared store means ticking a topic
// on the home roadmap, the Roadmap page or the home banner updates the others
// at once — and the `storage` event keeps other open tabs in step too.
const STORAGE_KEY = "aihub-roadmap-progress";
const listeners = new Set();

function read() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

let snapshot = typeof window === "undefined" ? {} : read();

function emit() {
  listeners.forEach((l) => l());
}

function write(next) {
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or blocked storage: progress lasts for this visit only.
  }
  emit();
}

function subscribe(listener) {
  listeners.add(listener);
  const onStorage = (e) => {
    if (e.key === STORAGE_KEY) {
      snapshot = read();
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
  const progress = useSyncExternalStore(subscribe, () => snapshot);
  const setDone = useCallback((id, done) => write({ ...snapshot, [id]: done }), []);
  const reset = useCallback(() => write({}), []);
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
