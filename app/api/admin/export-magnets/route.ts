import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const magnets = await prisma.magnets.findMany({
    include: {
      user: true,
      memory: true,
      scan_logs: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";

  const rows = [
    [
      "Magnet Kodu",
      "NFC URL",
      "Durum",
      "Telefon",
      "Plan",
      "Anı Başlığı",
      "Dil",
      "Okutulma Sayısı",
      "Oluşturulma Tarihi",
    ],
    ...magnets.map((magnet) => [
      magnet.magnet_code,
      `${baseUrl}/m/${magnet.magnet_code}`,
      magnet.is_active ? "Aktif" : "Pasif",
      magnet.user?.phone_number || "",
      magnet.user?.plan_type || "",
      magnet.memory?.title || "",
      magnet.memory?.selected_lang || "",
      magnet.scan_logs.length,
      magnet.created_at.toISOString(),
    ]),
  ];

  const csv = rows
    .map((row) => row.map(csvEscape).join(";"))
    .join("\n");

  return new NextResponse("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="story-magnet-export.csv"`,
    },
  });
}