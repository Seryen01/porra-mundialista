import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      predictions: {
        select: {
          points: true,
        },
      },
    },
  });

  const leaderboard = users.map((user) => {
    const totalPoints = user.predictions.reduce((sum, p) => sum + p.points, 0);
    return {
      id: user.id,
      name: user.name,
      points: totalPoints,
    };
  });

  // Sort by points descending
  leaderboard.sort((a, b) => b.points - a.points);

  return NextResponse.json(leaderboard);
}
