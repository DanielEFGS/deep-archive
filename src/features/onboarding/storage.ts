const FIELD_GUIDE_STORAGE_KEY = "deep-archive:field-guide";
const LEGACY_FIELD_GUIDE_STORAGE_KEY = "deep500:field-guide";

export function hasSeenFieldGuide() {
  try {
    return (
      localStorage.getItem(FIELD_GUIDE_STORAGE_KEY) === "seen" ||
      localStorage.getItem(LEGACY_FIELD_GUIDE_STORAGE_KEY) === "seen"
    );
  } catch {
    return false;
  }
}

export function rememberFieldGuide() {
  try {
    localStorage.setItem(FIELD_GUIDE_STORAGE_KEY, "seen");
    localStorage.removeItem(LEGACY_FIELD_GUIDE_STORAGE_KEY);
  } catch {
    // Storage is an optional enhancement; private modes may reject writes.
  }
}
