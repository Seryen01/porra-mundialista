import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculatePoints } from "@/lib/scoring";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try { session = await getServerSession(authOptions); } catch (e) {
    console.error('[matches/id] PATCH getServerSession error', e);
    return NextResponse.json({ error: "Auth error" }, { status: 500 });
  }
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { scoreA, scoreB, status, teamA, teamB, date, phase, isStarMatch } = body;

  const dataToUpdate: any = {};
  if (scoreA !== undefined) dataToUpdate.scoreA = (scoreA === "" || scoreA === null) ? null : parseInt(scoreA);
  if (scoreB !== undefined) dataToUpdate.scoreB = (scoreB === "" || scoreB === null) ? null : parseInt(scoreB);
  if (status) dataToUpdate.status = status;
  if (teamA) dataToUpdate.teamA = teamA;
  if (teamB) dataToUpdate.teamB = teamB;
  if (date) dataToUpdate.date = new Date(date);
  if (phase) dataToUpdate.phase = phase;
  if (isStarMatch !== undefined) dataToUpdate.isStarMatch = isStarMatch;

  if (isStarMatch === true) {
    const targetMatch = await prisma.match.findUnique({ where: { id } });
    if (targetMatch) {
      const matchDate = dataToUpdate.date || targetMatch.date;
      const startOfDay = new Date(matchDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(matchDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      await prisma.match.updateMany({
        where: {
          date: { gte: startOfDay, lte: endOfDay },
          id: { not: id }
        },
        data: { isStarMatch: false }
      });
    }
  }

  try {
    const match = await prisma.match.update({
      where: { id },
      data: dataToUpdate,
    });

    const finalScoreA = scoreA === "" || scoreA === null ? null : parseInt(scoreA as string);
    const finalScoreB = scoreB === "" || scoreB === null ? null : parseInt(scoreB as string);

    if (status === "FINISHED" && finalScoreA !== null && finalScoreB !== null && !isNaN(finalScoreA) && !isNaN(finalScoreB)) {
      await calculatePoints(id, finalScoreA, finalScoreB);
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error('[matches/id] PATCH error', error);
    return NextResponse.json({ error: "Error al actualizar partido" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try { session = await getServerSession(authOptions); } catch (e) {
    console.error('[matches/id] DELETE getServerSession error', e);
    return NextResponse.json({ error: "Auth error" }, { status: 500 });
  }
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.match.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[matches/id] DELETE error', error);
    return NextResponse.json({ error: "Error al eliminar partido" }, { status: 500 });
  }
}
