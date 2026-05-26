"use client";

import { useEffect } from "react";

export default function GalleryReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("gallery-item--visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll(".gallery-item").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return null;
}
