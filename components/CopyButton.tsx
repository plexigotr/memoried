"use client";

export default function CopyButton({
  text,
  label = "Kopyala",
}: {
  text: string;
  label?: string;
}) {
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    alert("Kopyalandı");
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-full border border-stone-300 px-3 py-1 text-xs hover:bg-stone-100"
    >
      {label}
    </button>
  );
}