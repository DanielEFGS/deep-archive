const SAFE_EXTERNAL_PROTOCOLS = new Set(["https:"]);

export function safeExternalUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return SAFE_EXTERNAL_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function safeDatasetPath(value: string): string | null {
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (!url.pathname.startsWith("/datasets/")) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}
