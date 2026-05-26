"use client";

import { useState } from "react";
import VideoTrimmer from "./VideoTrimmer";

type Props = {
  videoUrl: string;
  itemId: string;
  code: string;
  lang?: "tr" | "en";
};

export default function VideoTrimButton({ videoUrl, itemId, code, lang = "tr" }: Props) {
  const [open, setOpen] = useState(false);

  function handleDone() {
    setOpen(false);
    window.location.href = `/m/${code}/edit?updated=video`;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
      >
        ✂ {lang === "en" ? "Trim Video" : "Kırp"}
      </button>
    );
  }

  return (
    <div className="vtrim-modal-overlay">
      <div className="vtrim-modal">
        <VideoTrimmer
          source={{ kind: "url", url: videoUrl }}
          code={code}
          title=""
          itemId={itemId}
          lang={lang}
          onDone={handleDone}
          onCancel={() => setOpen(false)}
        />
      </div>
    </div>
  );
}
