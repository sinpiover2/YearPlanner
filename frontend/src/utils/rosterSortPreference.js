const STORAGE_KEY = "yearPlanner.rosterSortBy";

export function normalizeRosterSortBy(value) {
  return value === "first" ? "first" : "last";
}

// Remembers the teacher's roster sort choice for the rest of this browser
// session (sessionStorage, not localStorage) so it doesn't reset on every
// print action, but also doesn't leak into a future day's session.
export function loadRosterSortBy() {
  try {
    return normalizeRosterSortBy(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return "last";
  }
}

export function saveRosterSortBy(sortBy) {
  try {
    sessionStorage.setItem(STORAGE_KEY, normalizeRosterSortBy(sortBy));
  } catch {
    // sessionStorage can be unavailable (private browsing); the in-memory
    // App state still drives the current session's print requests.
  }
}
