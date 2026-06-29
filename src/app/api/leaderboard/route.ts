import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  console.log("[leaderboard] GET request");
  let users: { id: string; name: string | null; image: string | null; predictions: { points: number }[]; bonus: { points: number } | null }[];
  let totalMatches: number;
  let finishedMatches: number;
  try {
    [users, totalMatches, finishedMatches] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          image: true,
          predictions: { select: { points: true } },
          bonus: { select: { points: true } },
        },
      }),
      prisma.match.count(),
      prisma.match.count({ where: { status: "FINISHED" } }),
    ]);
    console.log("[leaderboard] Query OK", { users: users.length, totalMatches, finishedMatches });
  } catch (error) {
    console.error("[leaderboard] DB query failed", error);
    return NextResponse.json({ error: "Error al cargar la clasificación" }, { status: 500 });
  }

  const leaderboard = users.map((user) => {
    const matchPoints = user.predictions.reduce((sum, p) => sum + p.points, 0);
    const bonusPoints = user.bonus?.points || 0;
    return {
      id: user.id,
      name: user.name,
      image: user.image,
      points: matchPoints + bonusPoints,
      matchPoints,
      bonusPoints,
    };
  });

  leaderboard.sort((a, b) => b.points - a.points);

  const allFinished = totalMatches > 0 && totalMatches === finishedMatches;

  return NextResponse.json({ users: leaderboard, allFinished }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
