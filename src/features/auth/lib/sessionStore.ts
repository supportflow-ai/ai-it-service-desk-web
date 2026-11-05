/** `signedOut` is true only after an explicit sign-out, here or in another tab, not after an expiry. */
interface SessionSnapshot { token: string | null; version: number; signedOut: boolean }
let snapshot: SessionSnapshot = { token: null, version: 0, signedOut: false };
let followingOtherTabs = false;
const listeners = new Set<() => void>();

function publish(token: string | null, signedOut = false) {
  snapshot = { token, version: snapshot.version + 1, signedOut };
  listeners.forEach((listener) => listener());
}

function replace(token: string | null, signedOut = false) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
  publish(token, signedOut);
}

/**
 * Every tab shares the stored token, so a sign-in, account switch or sign-out in another tab
 * is followed here too; otherwise this tab would keep showing the previous account until reload.
 */
function followOtherTab(event: StorageEvent) {
  if (event.key !== null && event.key !== 'token') return;
  const token = localStorage.getItem('token');
  if (token !== snapshot.token) publish(token, token === null);
}

/** Importing Auth does not access browser storage. */
export const sessionStore = {
  getSnapshot: () => snapshot,
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  restore() {
    replace(localStorage.getItem('token'));
    if (!followingOtherTabs) {
      window.addEventListener('storage', followOtherTab);
      followingOtherTabs = true;
    }
  },
  setToken: (token: string) => replace(token),
  clear: () => replace(null, true),
  expire(token: string, version: number) {
    if (snapshot.token === token && snapshot.version === version) replace(null);
  },
};
