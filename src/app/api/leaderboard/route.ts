import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [users, totalMatches, finishedMatches] = await Promise.all([
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

  return NextResponse.json({ users: leaderboard, allFinished });
}
