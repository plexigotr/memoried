"use client";

import { useEffect } from "react";

const KEY = "edit-scroll-y";

export default function ScrollPreserver() {
  useEffect(() => {
    // Tarayıcının kendi scroll geri yüklemesini devre dışı bırak
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const saved = sessionStorage.getItem(KEY);
    if (saved !== null) {
      const y = parseInt(saved, 10);
      sessionStorage.removeItem(KEY);

      const apply = () => window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });

      // 3 kez uygula: layout, paint ve geç yüklenen içerik için
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          apply();
          setTimeout(apply, 60);
          setTimeout(apply, 220);
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
