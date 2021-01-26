export const isBrowser = typeof window !== 'undefined';
export const isNotBrowser = !isBrowser;

export const hasLocalStorage = (): boolean => {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
};
export const hasSessionStorage = (): boolean => {
  try {
    return typeof sessionStorage !== 'undefined';
  } catch {
    return false;
  }
};
