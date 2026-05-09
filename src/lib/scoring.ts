import { prisma } from "@/lib/prisma";

export async function calculatePoints(matchId: string, scoreA: number, scoreB: number) {
  const predictions = await prisma.prediction.findMany({
    where: { matchId },
  });

  const realOutcome = scoreA > scoreB ? "1" : scoreA < scoreB ? "2" : "X";

  for (const prediction of predictions) {
    let points = 0;
    const predA = prediction.predictedScoreA;
    const predB = prediction.predictedScoreB;
    const predOutcome = predA > predB ? "1" : predA < predB ? "2" : "X";

    if (predA === scoreA && predB === scoreB) {
      points = 5;
    } else if (predOutcome === realOutcome) {
      points = 3;
    } else {
      points = 0;
    }

    await prisma.prediction.update({
      where: { id: prediction.id },
      data: { points },
    });
  }
}
