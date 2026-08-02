export function safeReturnPath(
  value: string | null | undefined,
  fallback = "/account"
) {
  const candidate = value?.trim() || "";

  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    candidate.includes("\0")
  ) {
    return fallback;
  }

  try {
    const base = new URL("https://memoried.me");
    const parsed = new URL(candidate, base);

    if (parsed.origin !== base.origin) return fallback;
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return fallback;
  }
}
