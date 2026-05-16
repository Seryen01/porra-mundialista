import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      predictions: {
        select: {
          points: true,
        },
      },
      bonus: {
        select: {
          points: true,
        }
      }
    },
  });

  const leaderboard = users.map((user) => {
    const matchPoints = user.predictions.reduce((sum, p) => sum + p.points, 0);
    const bonusPoints = user.bonus?.points || 0;
    const totalPoints = matchPoints + bonusPoints;
    
    return {
      id: user.id,
      name: user.name,
      image: user.image,
      points: totalPoints,
      matchPoints,
      bonusPoints
    };
  });

  // Sort by points descending
  leaderboard.sort((a, b) => b.points - a.points);

  return NextResponse.json(leaderboard);
}
