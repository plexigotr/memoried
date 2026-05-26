"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  code: string;
};

export default function DragSort({ code }: Props) {
  const [saving, setSaving] = useState(false);
  const draggedIdRef = useRef<string | null>(null);

  useEffect(() => {
    const container = document.querySelector<HTMLElement>(".drag-sort-list");
    if (!container) return;

    function getArticles() {
      return Array.from(
        container!.querySelectorAll<HTMLElement>("[data-item-id]")
      );
    }

    function onHandleMouseDown(this: HTMLElement) {
      const article = this.closest<HTMLElement>("[data-item-id]");
      if (article) article.setAttribute("draggable", "true");
    }

    function onHandleMouseUp() {
      getArticles().forEach((el) => el.setAttribute("draggable", "false"));
    }

    function onDragStart(this: HTMLElement, e: DragEvent) {
      draggedIdRef.current = this.getAttribute("data-item-id");
      this.classList.add("drag-item--dragging");
      if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    }

    function onDragOver(e: DragEvent) {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    }

    function onDragEnter(this: HTMLElement) {
      const id = this.getAttribute("data-item-id");
      if (!draggedIdRef.current || id === draggedIdRef.current) return;
      this.classList.add("drag-item--over");

      const dragged = container!.querySelector<HTMLElement>(
        `[data-item-id="${draggedIdRef.current}"]`
      );
      if (!dragged) return;

      const all = getArticles();
      const fromIdx = all.indexOf(dragged);
      const toIdx = all.indexOf(this);

      if (fromIdx < toIdx) {
        container!.insertBefore(dragged, this.nextSibling);
      } else {
        container!.insertBefore(dragged, this);
      }
    }

    function onDragLeave(this: HTMLElement) {
      this.classList.remove("drag-item--over");
    }

    function onDrop(this: HTMLElement, e: DragEvent) {
      e.preventDefault();
      this.classList.remove("drag-item--over");
    }

    async function onDragEnd(this: HTMLElement) {
      this.classList.remove("drag-item--dragging");
      getArticles().forEach((el) => {
        el.setAttribute("draggable", "false");
        el.classList.remove("drag-item--over");
      });

      const newOrder = getArticles().map((el) => el.getAttribute("data-item-id")!);

      if (!newOrder.includes(draggedIdRef.current!)) {
        draggedIdRef.current = null;
        return;
      }
      draggedIdRef.current = null;

      setSaving(true);
      try {
        const res = await fetch(`/api/magnets/${code}/reorder-items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: newOrder }),
        });
        if (res.ok) {
          sessionStorage.setItem("edit-scroll-y", String(window.scrollY));
          location.reload();
        }
      } finally {
        setSaving(false);
      }
    }

    const articles = getArticles();
    articles.forEach((article) => {
      article.setAttribute("draggable", "false");
      article.addEventListener("dragstart", onDragStart as any);
      article.addEventListener("dragover", onDragOver);
      article.addEventListener("dragenter", onDragEnter as any);
      article.addEventListener("dragleave", onDragLeave as any);
      article.addEventListener("drop", onDrop as any);
      article.addEventListener("dragend", onDragEnd as any);
    });

    const handles = container.querySelectorAll<HTMLElement>(".drag-handle");
    handles.forEach((handle) => {
      handle.addEventListener("mousedown", onHandleMouseDown as any);
      handle.addEventListener("mouseup", onHandleMouseUp);
      handle.addEventListener("touchstart", onHandleMouseDown as any, { passive: true });
      handle.addEventListener("touchend", onHandleMouseUp);
    });

    return () => {
      articles.forEach((article) => {
        article.removeEventListener("dragstart", onDragStart as any);
        article.removeEventListener("dragover", onDragOver);
        article.removeEventListener("dragenter", onDragEnter as any);
        article.removeEventListener("dragleave", onDragLeave as any);
        article.removeEventListener("drop", onDrop as any);
        article.removeEventListener("dragend", onDragEnd as any);
      });
      handles.forEach((handle) => {
        handle.removeEventListener("mousedown", onHandleMouseDown as any);
        handle.removeEventListener("mouseup", onHandleMouseUp);
      });
    };
  }, [code]);

  if (!saving) return null;

  return (
    <div className="drag-sort-saving">
      <svg className="drag-sort-spinner" viewBox="0 0 24 24" fill="none" width={16} height={16}>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20" />
      </svg>
      Sıralama kaydediliyor…
    </div>
  );
}
