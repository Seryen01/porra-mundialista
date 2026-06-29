import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  try {
    // 1. Get user basic info and bonus record
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        name: true, 
        image: true, 
        email: true, 
        role: true,
        bonus: {
          select: { points: true }
        }
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Fetch all predictions with match details to compute statistics
    const predictions = await prisma.prediction.findMany({
      where: { userId },
      include: {
        match: true
      }
    });

    // 3. Compute statistics
    const finishedPredictions = predictions.filter(p => p.match.status === "FINISHED");
    const totalFinished = finishedPredictions.length;
    
    let exact = 0;
    let correctTendency = 0;
    let missed = 0;

    finishedPredictions.forEach(p => {
      const isExact = p.predictedScoreA === p.match.scoreA && p.predictedScoreB === p.match.scoreB;
      if (isExact) {
        exact++;
      } else if (p.points > 0) {
        correctTendency++;
      } else {
        missed++;
      }
    });

    const predictionPoints = predictions.reduce((sum, p) => sum + p.points, 0);
    const bonusPoints = user.bonus?.points || 0;
    const totalPoints = predictionPoints + bonusPoints;

    // 4. Calculate ranking position
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        predictions: { select: { points: true } },
        bonus: { select: { points: true } }
      }
    });

    const leaderboard = allUsers.map(u => {
      const pts = u.predictions.reduce((sum, p) => sum + p.points, 0) + (u.bonus?.points || 0);
      return { id: u.id, points: pts };
    });

    leaderboard.sort((a, b) => b.points - a.points);
    const rank = leaderboard.findIndex(u => u.id === userId) + 1;

    // 5. Calculate favorite (best) and worst teams based on average points
    const teamStats: Record<string, { points: number; count: number }> = {};
    
    finishedPredictions.forEach(p => {
      // Team A
      if (!teamStats[p.match.teamA]) teamStats[p.match.teamA] = { points: 0, count: 0 };
      teamStats[p.match.teamA].points += p.points;
      teamStats[p.match.teamA].count += 1;

      // Team B
      if (!teamStats[p.match.teamB]) teamStats[p.match.teamB] = { points: 0, count: 0 };
      teamStats[p.match.teamB].points += p.points;
      teamStats[p.match.teamB].count += 1;
    });

    let bestTeam = "Ninguno";
    let bestPoints = -1;
    let worstTeam = "Ninguno";
    let worstPoints = 99999;
    const hasStats = finishedPredictions.length > 0;

    Object.entries(teamStats).forEach(([team, data]) => {
      const avgPoints = data.points / data.count;
      if (avgPoints > bestPoints) {
        bestPoints = avgPoints;
        bestTeam = team;
      }
      if (avgPoints < worstPoints) {
        worstPoints = avgPoints;
        worstTeam = team;
      }
    });

    if (bestPoints <= 0) bestTeam = "Ninguno";
    if (worstPoints === 99999 || finishedPredictions.length === 0) worstTeam = "Ninguno";

    return NextResponse.json({
      ...user,
      stats: {
        totalPredictions: predictions.length,
        finishedPredictions: totalFinished,
        exact,
        correctTendency,
        missed,
        totalPoints,
        rank,
        bestTeam,
        worstTeam,
        hasStats
      }
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch profile stats" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { image } = await req.json();
    
    const userId = (session.user as any).id;
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { image },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
