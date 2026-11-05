/** `signedOut` is true only after an explicit sign-out, here or in another tab, not after an expiry. */
export interface SessionSnapshot {
  token: string | null;
  refreshToken: string | null;
  version: number;
  signedOut: boolean;
}

let snapshot: SessionSnapshot = { token: null, refreshToken: null, version: 0, signedOut: false };
let followingOtherTabs = false;
const listeners = new Set<() => void>();

function publish(token: string | null, refreshToken: string | null, signedOut = false) {
  snapshot = { token, refreshToken, version: snapshot.version + 1, signedOut };
  listeners.forEach((listener) => listener());
}

function replace(token: string | null, refreshToken: string | null = null, signedOut = false) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');

  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  else localStorage.removeItem('refreshToken');

  publish(token, refreshToken, signedOut);
}

/**
 * Every tab shares the stored token, so a sign-in, account switch or sign-out in another tab
 * is followed here too; otherwise this tab would keep showing the previous account until reload.
 */
function followOtherTab(event: StorageEvent) {
  if (event.key !== null && event.key !== 'token' && event.key !== 'refreshToken') return;
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  if (token !== snapshot.token || refreshToken !== snapshot.refreshToken) {
    publish(token, refreshToken, token === null);
  }
}

/** Importing Auth does not access browser storage. */
export const sessionStore = {
  getSnapshot: () => snapshot,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  restore() {
    replace(localStorage.getItem('token'), localStorage.getItem('refreshToken'));
    if (!followingOtherTabs) {
      window.addEventListener('storage', followOtherTab);
      followingOtherTabs = true;
    }
  },
  setTokens: (token: string, refreshToken?: string | null) => replace(token, refreshToken ?? snapshot.refreshToken),
  setToken: (token: string) => replace(token, snapshot.refreshToken),
  clear: () => replace(null, null, true),
  expire(token: string, version: number) {
    if (snapshot.token === token && snapshot.version === version) replace(null, null);
  },
};
