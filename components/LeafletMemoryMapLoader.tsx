"use client";

import dynamic from "next/dynamic";
import type { LocationItem } from "@/lib/osmLocation";

const LeafletMemoryMapMode = dynamic(
  () => import("@/components/LeafletMemoryMapMode"),
  { ssr: false }
);

export default function LeafletMemoryMapLoader({
  items,
}: {
  items: LocationItem[];
}) {
  return <LeafletMemoryMapMode items={items} />;
}
