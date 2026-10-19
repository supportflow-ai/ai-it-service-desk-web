interface SessionSnapshot { token: string | null; version: number }
let snapshot: SessionSnapshot = { token: null, version: 0 };
const listeners = new Set<() => void>();

function replace(token: string | null) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
  snapshot = { token, version: snapshot.version + 1 };
  listeners.forEach((listener) => listener());
}

/** Importing Auth does not access browser storage. */
export const sessionStore = {
  getSnapshot: () => snapshot,
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  restore() { replace(localStorage.getItem('token')); },
  setToken: (token: string) => replace(token),
  clear: () => replace(null),
  expire(token: string, version: number) {
    if (snapshot.token === token && snapshot.version === version) replace(null);
  },
};
