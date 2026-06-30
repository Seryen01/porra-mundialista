import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();
  const { matchId, scoreA, scoreB } = body;

  if (scoreA === undefined || scoreB === undefined || scoreA === "" || scoreB === "" || isNaN(parseInt(scoreA)) || isNaN(parseInt(scoreB))) {
    return NextResponse.json({ error: "Puntuaciones inválidas" }, { status: 400 });
  }

  try {
    const match = await prisma.match.findUnique({ where: { id: matchId } });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const now = new Date();
    if (match.status !== "UPCOMING" || match.date < now) {
      return NextResponse.json({ error: "Match already started or finished" }, { status: 400 });
    }

    const prediction = await prisma.prediction.upsert({
      where: { userId_matchId: { userId, matchId } },
      update: { predictedScoreA: parseInt(scoreA), predictedScoreB: parseInt(scoreB) },
      create: { userId, matchId, predictedScoreA: parseInt(scoreA), predictedScoreB: parseInt(scoreB) },
    });

    return NextResponse.json(prediction);
  } catch (error) {
    console.error('[predictions] POST DB error', error);
    return NextResponse.json({ error: "Error al guardar predicción" }, { status: 500 });
  }
}

// GET all predictions for a specific match (revealed only if match started)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId");

  if (!matchId) {
    return NextResponse.json({ error: "Match ID required" }, { status: 400 });
  }

  console.log('[predictions] GET request', { matchId, userId: (session.user as any).id });

  try {
    const match = await prisma.match.findUnique({ where: { id: matchId } });

    if (!match) {
      console.warn('[predictions] Match not found', { matchId });
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const now = new Date();
    const isRevealed = match.status !== "UPCOMING" || match.date < now;
    console.log('[predictions] Visibility check', { matchId, status: match.status, isRevealed });

    if (!isRevealed) {
      const prediction = await prisma.prediction.findUnique({
        where: { userId_matchId: { userId: (session.user as any).id, matchId } },
      });
      console.log('[predictions] Not revealed — own prediction only', { hasPrediction: !!prediction });
      return NextResponse.json(prediction ? [prediction] : []);
    }

    const predictions = await prisma.prediction.findMany({
      where: { matchId },
      include: { user: { select: { name: true, image: true } } },
      orderBy: { points: "desc" },
    });

    console.log('[predictions] Revealed — all predictions', { matchId, count: predictions.length });
    return NextResponse.json(predictions);
  } catch (error) {
    console.error('[predictions] GET DB error', error);
    return NextResponse.json({ error: "Error al cargar predicciones" }, { status: 500 });
  }
}
