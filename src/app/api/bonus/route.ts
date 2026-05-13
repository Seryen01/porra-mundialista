import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bonus = await prisma.userBonus.findUnique({
    where: { userId: (session.user as any).id }
  });

  return NextResponse.json(bonus || {});
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verificamos que el torneo no haya empezado
  // Supongamos que el primer partido es el 11 de junio de 2026
  const tournamentStart = new Date("2026-06-11T20:00:00Z");
  if (new Date() >= tournamentStart) {
    return NextResponse.json({ error: "El torneo ya ha comenzado. No se pueden modificar los bonus." }, { status: 400 });
  }

  const { topScorer, champion, spainResult } = await req.json();
  const userId = (session.user as any).id;

  const bonus = await prisma.userBonus.upsert({
    where: { userId },
    update: { topScorer, champion, spainResult },
    create: { userId, topScorer, champion, spainResult }
  });

  return NextResponse.json(bonus);
}
