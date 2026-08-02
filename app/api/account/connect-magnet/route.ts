import { NextRequest, NextResponse } from "next/server";
import { getAccountPhone } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function accountRedirect(request: NextRequest, error: string) {
  return NextResponse.redirect(
    new URL(`/account?error=${encodeURIComponent(error)}`, request.url),
    303
  );
}

export async function POST(request: NextRequest) {
  const phoneNumber = await getAccountPhone();
  if (!phoneNumber) {
    return NextResponse.redirect(
      new URL(
        `/account/login?returnTo=${encodeURIComponent("/account")}`,
        request.url
      ),
      303
    );
  }

  const formData = await request.formData();
  const magnetCode = String(formData.get("magnetCode") || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  if (!magnetCode || magnetCode.length > 100 || !/^[A-Z0-9_-]+$/.test(magnetCode)) {
    return accountRedirect(request, "invalid-magnet-code");
  }

  const [user, magnet] = await Promise.all([
    prisma.users.findUnique({
      where: { phone_number: phoneNumber },
      select: { id: true },
    }),
    prisma.magnets.findUnique({
      where: { magnet_code: magnetCode },
      include: {
        memory: {
          select: { selected_lang: true },
        },
      },
    }),
  ]);

  if (!user) return accountRedirect(request, "account-not-found");
  if (!magnet) return accountRedirect(request, "magnet-not-found");

  if (magnet.is_active || magnet.user_id) {
    if (magnet.user_id === user.id && magnet.memory) {
      const language = magnet.memory.selected_lang === "en" ? "en" : "tr";
      return NextResponse.redirect(
        new URL(`/m/${encodeURIComponent(magnetCode)}/edit?lang=${language}`, request.url),
        303
      );
    }

    return accountRedirect(request, "magnet-already-used");
  }

  return NextResponse.redirect(
    new URL(`/m/${encodeURIComponent(magnetCode)}/setup?lang=tr`, request.url),
    303
  );
}
