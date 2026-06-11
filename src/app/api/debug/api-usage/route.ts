// app/api/debug/api-usage/route.ts
// Devuelve el consumo diario de la WC2026 API registrado en BD.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DAILY_LIMIT = 200;

export async function GET() {
  console.log("[api-usage] Consultando consumo de API");

  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);

    const rows = await prisma.dailyApiUsage.findMany({
      where: { date: { gte: sevenDaysAgo } },
      orderBy: { date: "desc" },
    });

    const todayRow = rows.find((r) => r.date.getTime() === today.getTime());
    const todayCount = todayRow?.callCount ?? 0;

    console.log("[api-usage] Datos obtenidos", { todayCount, rows: rows.length });

    return NextResponse.json({
      dailyLimit: DAILY_LIMIT,
      today: {
        date: today.toISOString().split("T")[0],
        callCount: todayCount,
        remaining: DAILY_LIMIT - todayCount,
        usedPercent: Math.round((todayCount / DAILY_LIMIT) * 100),
      },
      last7Days: rows.map((r) => ({
        date: r.date.toISOString().split("T")[0],
        callCount: r.callCount,
      })),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[api-usage] Error consultando BD", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
