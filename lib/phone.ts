import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

export const DEFAULT_PHONE_COUNTRY: CountryCode = "TR";

export function normalizePhoneNumber(
  input: string,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY
) {
  const compact = input.trim().replace(/[\s().-]/g, "");
  if (!compact) return null;

  const international = compact.startsWith("00")
    ? `+${compact.slice(2)}`
    : compact;
  const candidate = international.startsWith("+")
    ? `+${international.slice(1).replace(/\D/g, "")}`
    : international;
  const parsed = parsePhoneNumberFromString(candidate, defaultCountry);

  if (!parsed || !parsed.isPossible()) return null;
  return parsed.number;
}
