import { useEffect } from 'react';

/**
 * While `active`, closing or reloading the tab asks for confirmation. The app's component router
 * (BrowserRouter) has no navigation blocker, so moves inside the app are not intercepted.
 */
export function useUnsavedChangesPrompt(active: boolean) {
  useEffect(() => {
    if (!active) return undefined;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Some browsers still need returnValue set to show the prompt.
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [active]);
}
