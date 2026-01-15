const prefetchedKeys = new Set();

export const canPrefetch = () => {
  if (typeof window === 'undefined') return false;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection?.saveData) return false;
  const effectiveType = connection?.effectiveType;
  if (effectiveType && (effectiveType === 'slow-2g' || effectiveType === '2g')) {
    return false;
  }
  return true;
};

export const prefetchOnce = (key, loader) => {
  if (!key || typeof loader !== 'function') return;
  if (prefetchedKeys.has(key)) return;
  if (!canPrefetch()) return;

  prefetchedKeys.add(key);
  const run = () => loader().catch(() => {});

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 1000 });
  } else {
    setTimeout(run, 200);
  }
};
