"use client";

import { useEffect } from "react";

const KEY = "edit-scroll-y";

export default function ScrollPreserver() {
  useEffect(() => {
    const saved = sessionStorage.getItem(KEY);
    if (saved !== null) {
      const y = parseInt(saved, 10);
      sessionStorage.removeItem(KEY);
      // rAF çift çağrısı: layout + paint bitmeden scroll uygulanırsa sıfırlanır
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
        });
      });
    }

    function onSubmit() {
      sessionStorage.setItem(KEY, String(window.scrollY));
    }

    const forms = document.querySelectorAll<HTMLFormElement>("form");
    forms.forEach((f) => f.addEventListener("submit", onSubmit));
    return () => forms.forEach((f) => f.removeEventListener("submit", onSubmit));
  }, []);

  return null;
}
