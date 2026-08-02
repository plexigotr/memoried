"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCountries,
  getCountryCallingCode,
  isSupportedCountry,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { DEFAULT_PHONE_COUNTRY, normalizePhoneNumber } from "@/lib/phone";

type PhoneNumberFieldProps = {
  id?: string;
  name?: string;
  required?: boolean;
  className?: string;
};

const regionNames = new Intl.DisplayNames(["tr"], { type: "region" });

function countryFlag(country: CountryCode) {
  return country
    .toUpperCase()
    .split("")
    .map((character) => String.fromCodePoint(127397 + character.charCodeAt(0)))
    .join("");
}

const countryOptions = getCountries()
  .map((country) => ({
    country,
    name: regionNames.of(country) || country,
    callingCode: getCountryCallingCode(country),
  }))
  .sort((left, right) => {
    if (left.country === DEFAULT_PHONE_COUNTRY) return -1;
    if (right.country === DEFAULT_PHONE_COUNTRY) return 1;
    return left.name.localeCompare(right.name, "tr");
  });

export default function PhoneNumberField({
  id = "phoneNumber",
  name = "phoneNumber",
  required = true,
  className = "",
}: PhoneNumberFieldProps) {
  const [country, setCountry] = useState<CountryCode>(DEFAULT_PHONE_COUNTRY);
  const [nationalNumber, setNationalNumber] = useState("");
  const userChangedField = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    async function detectCountry() {
      try {
        const response = await fetch("/api/phone/country", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json()) as { country?: string };

        if (
          !userChangedField.current &&
          data.country &&
          isSupportedCountry(data.country)
        ) {
          setCountry(data.country);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn("Phone country detection failed:", error);
        }
      }
    }

    void detectCountry();
    return () => controller.abort();
  }, []);

  const canonicalNumber = useMemo(
    () => normalizePhoneNumber(nationalNumber, country) || "",
    [country, nationalNumber]
  );

  function handleCountryChange(value: string) {
    userChangedField.current = true;
    if (isSupportedCountry(value)) setCountry(value);
  }

  function handleNumberChange(rawValue: string) {
    userChangedField.current = true;
    const compact = rawValue.replace(/\s+/g, "");
    const looksInternational =
      compact.startsWith("+") || compact.startsWith("00");

    if (looksInternational) {
      const international = compact.startsWith("00")
        ? `+${compact.slice(2)}`
        : compact;
      const parsed = parsePhoneNumberFromString(international);

      if (parsed?.country) {
        setCountry(parsed.country);
        setNationalNumber(parsed.nationalNumber);
        return;
      }
    }

    const digits = compact.replace(/\D/g, "");
    setNationalNumber(country === "TR" ? digits.replace(/^0+/, "") : digits);
  }

  return (
    <div
      className={`flex overflow-hidden rounded-2xl border border-stone-300 bg-white transition focus-within:border-stone-500 ${className}`}
    >
      <select
        aria-label="Ülke ve telefon kodu"
        value={country}
        onChange={(event) => handleCountryChange(event.target.value)}
        className="min-w-0 max-w-[52%] border-r border-stone-200 bg-stone-50 px-3 py-3 text-sm outline-none"
      >
        {countryOptions.map((option) => (
          <option key={option.country} value={option.country}>
            {countryFlag(option.country)} {option.name} (+{option.callingCode})
          </option>
        ))}
      </select>

      <div className="flex min-w-0 flex-1 items-center">
        <span className="pl-3 text-sm text-stone-500">
          +{getCountryCallingCode(country)}
        </span>
        <input type="hidden" name={name} value={canonicalNumber} />
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          aria-label="Telefon numarası"
          value={nationalNumber}
          onChange={(event) => handleNumberChange(event.target.value)}
          placeholder={country === "TR" ? "5XXXXXXXXX" : "Telefon numarası"}
          className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm outline-none"
          required={required}
        />
      </div>
    </div>
  );
}
