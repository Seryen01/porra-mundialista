import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePoints } from "@/lib/scoring";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const now = new Date();

  // Only process matches that are still in play (UPCOMING or LIVE)
  const activeMatches = await prisma.match.findMany({
    where: { status: { in: ["UPCOMING", "LIVE"] } },
  });

  let changedCount = 0;

  for (const match of activeMatches) {
    const isGroupStage = match.phase.toLowerCase().includes("grupo");
    const durationMinutes = isGroupStage ? 100 : 150;
    const finishTime = new Date(match.date.getTime() + durationMinutes * 60000);

    if (match.status === "UPCOMING" && now >= match.date) {
      // Auto-LIVE: match has started
      await prisma.match.update({ where: { id: match.id }, data: { status: "LIVE" } });
      changedCount++;
    } else if (match.status === "LIVE" && now >= finishTime) {
      // Auto-PENDING: match time is up — awaits admin validation before points are calculated
      await prisma.match.update({ where: { id: match.id }, data: { status: "PENDING" } });
      changedCount++;
    }
  }

  return NextResponse.json({ success: true, changedCount });
}
