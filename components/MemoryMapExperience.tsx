"use client";

import { useEffect, useMemo, useState } from "react";

type MemoryMarker = {
  id: string;
  scene: string;
  title: string;
  locationName: string;
  latitude: number;
  longitude: number;
};

function mapSrc(latitude: number, longitude: number) {
  const delta = 0.018;
  const left = longitude - delta;
  const right = longitude + delta;
  const bottom = latitude - delta;
  const top = latitude + delta;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

export default function MemoryMapExperience({
  markers,
  emptyTitle,
  emptyText,
}: {
  markers: MemoryMarker[];
  emptyTitle: string;
  emptyText: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeMarker = markers[activeIndex] || markers[0];
  const activeSrc = useMemo(() => {
    if (!activeMarker) return "";
    return mapSrc(activeMarker.latitude, activeMarker.longitude);
  }, [activeMarker]);

  useEffect(() => {
    if (markers.length === 0) return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-memory-scene]"));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        const rawIndex = visible.target.getAttribute("data-memory-scene");
        const nextIndex = Number(rawIndex || 0);

        if (!Number.isNaN(nextIndex) && markers[nextIndex]) {
          setActiveIndex(nextIndex);
        }
      },
      {
        threshold: [0.35, 0.55, 0.75],
        rootMargin: "-12% 0px -35% 0px",
      }
    );

    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, [markers]);

  if (markers.length === 0) {
    return (
      <div className="memory-map-shell p-6">
        <div className="memory-map-empty">
          <div className="memory-map-empty-dot" />
          <h3>{emptyTitle}</h3>
          <p>{emptyText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="memory-map-shell">
      <div className="memory-map-frame">
        <iframe
          key={`${activeMarker.latitude}-${activeMarker.longitude}`}
          src={activeSrc}
          title={activeMarker.locationName}
          loading="lazy"
          className="memory-map-iframe"
        />
        <div className="memory-map-shade" />
        <div className="memory-map-active-card">
          <span>{activeMarker.scene}</span>
          <strong>{activeMarker.locationName}</strong>
          <small>{activeMarker.title}</small>
        </div>
      </div>

      <div className="memory-map-list">
        {markers.map((marker, index) => (
          <button
            key={marker.id}
            type="button"
            onClick={() => {
              setActiveIndex(index);
              document.querySelector(`[data-memory-scene="${index}"]`)?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }}
            className={`memory-map-list-item ${index === activeIndex ? "is-active" : ""}`}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong>{marker.locationName}</strong>
              <small>{marker.title}</small>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
