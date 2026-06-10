import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let settings = await prisma.appSettings.findUnique({
    where: { id: "default" }
  });

  if (!settings) {
    settings = await prisma.appSettings.create({
      data: { id: "default" }
    });
  }

  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { topScorerPoints, championPoints, spainPoints, mvpPoints, actualTopScorer, actualChampion, actualSpainResult, actualMvp } = body;

  const settings = await prisma.appSettings.upsert({
    where: { id: "default" },
    update: {
      topScorerPoints: topScorerPoints !== undefined ? parseInt(topScorerPoints) : undefined,
      championPoints: championPoints !== undefined ? parseInt(championPoints) : undefined,
      spainPoints: spainPoints !== undefined ? parseInt(spainPoints) : undefined,
      mvpPoints: mvpPoints !== undefined ? parseInt(mvpPoints) : undefined,
      actualTopScorer: actualTopScorer !== undefined ? actualTopScorer : undefined,
      actualChampion: actualChampion !== undefined ? actualChampion : undefined,
      actualSpainResult: actualSpainResult !== undefined ? actualSpainResult : undefined,
      actualMvp: actualMvp !== undefined ? actualMvp : undefined,
    },
    create: {
      id: "default",
      topScorerPoints: topScorerPoints !== undefined ? parseInt(topScorerPoints) : 10,
      championPoints: championPoints !== undefined ? parseInt(championPoints) : 15,
      spainPoints: spainPoints !== undefined ? parseInt(spainPoints) : 10,
      mvpPoints: mvpPoints !== undefined ? parseInt(mvpPoints) : 10,
      actualTopScorer,
      actualChampion,
      actualSpainResult,
      actualMvp,
    }
  });

  // Si se envían resultados, recalculamos automáticamente todos los bonus en una sola transacción
  if (actualTopScorer !== undefined || actualChampion !== undefined || actualSpainResult !== undefined || actualMvp !== undefined) {
    const allBonuses = await prisma.userBonus.findMany();
    console.log("[settings] Recalculando bonus para todos los usuarios", { count: allBonuses.length, settings: { actualTopScorer: settings.actualTopScorer, actualChampion: settings.actualChampion, actualSpainResult: settings.actualSpainResult, actualMvp: settings.actualMvp } });

    const updates = allBonuses.map((b) => {
      let total = 0;
      if (settings.actualTopScorer && b.topScorer && b.topScorer.trim().toLowerCase() === settings.actualTopScorer.trim().toLowerCase()) {
        total += settings.topScorerPoints;
      }
      if (settings.actualChampion && b.champion === settings.actualChampion) {
        total += settings.championPoints;
      }
      if (settings.actualSpainResult && b.spainResult === settings.actualSpainResult) {
        total += settings.spainPoints;
      }
      if (settings.actualMvp && b.mvp && b.mvp.trim().toLowerCase() === settings.actualMvp.trim().toLowerCase()) {
        total += settings.mvpPoints;
      }
      return prisma.userBonus.update({ where: { id: b.id }, data: { points: total } });
    });

    await prisma.$transaction(updates);
    console.log("[settings] Recálculo de bonus completado", { updatedCount: updates.length });
  }

  return NextResponse.json(settings);
}
