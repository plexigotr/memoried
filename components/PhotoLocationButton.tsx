"use client";

import OSMLocationPicker, {
  type LocationValue,
} from "@/components/OSMLocationPicker";

type Props = {
  lang: "tr" | "en";
  code?: string;
  itemId?: string;
  initialLocationName?: string | null;
  initialLatitude?: number | string | null;
  initialLongitude?: number | string | null;
  onLocationSelected?: (value: LocationValue | null) => void;
};

export default function PhotoLocationButton(props: Props) {
  return <OSMLocationPicker {...props} />;
}
