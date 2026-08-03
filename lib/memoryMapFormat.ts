export function cleanMemoryNoteh(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") {
        const note = (parsed as any).note || (parsed as any).text || (parsed as any).description || "";
        return typeof note === "string" ? note : "";
      }
    } catch {}
    if (trimmed.startsWith("{") && trimmed.includes("latitude")) return "";
    return trimmed;
  }
  if (typeof value === "object") {
    const note = (value as any).note || (value as any).text || (value as any).description || "";
    return typeof note === "string" ? note : "";
  }
  return "";
}

export function shortLocationName(value: unknown): string {
  if (!value || typeof value !== "string") return "";
  let text = value.trim();
  if (!text) return "";

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      text = String((parsed as any).locationName || (parsed as any).location_name || "");
    }
  } catch {}

  text = text.replace(/\s+/g, " ").trim();

  const parts = text
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !/^no[:\s]/i.test(p))
    .filter((p) => !/sokak|cadde|mahallesi|mah\.|no:|bölge/i.test(p));

  const countryIndex = parts.findIndex((p) => /türkiye|turkey|greece|italy|france|spain|germany|macedonia|bulgaria|romania|albania|croatia|serbia/i.test(p));
  const beforeCountry = countryIndex >= 0 ? parts.slice(0, countryIndex) : parts;
  const cityLike = beforeCountry.filter((p) => !/\d/.test(p));

  if (cityLike.length >= 2) return cityLike.slice(-2).join(", ");
  if (cityLike.length === 1) return cityLike[0];
  if (beforeCountry.length >= 2) return beforeCountry.slice(-2).join(", ");
  if (beforeCountry.length === 1) return beforeCountry[0];
  return text;
}
