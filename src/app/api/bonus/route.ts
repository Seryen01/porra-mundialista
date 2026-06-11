import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TOURNAMENT_START } from "@/lib/config";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bonus = await prisma.userBonus.findUnique({
    where: { userId: (session.user as any).id }
  });

  const isLocked = new Date() >= TOURNAMENT_START;
  console.log('[bonus] GET - isLocked:', isLocked, 'now:', new Date().toISOString(), 'start:', TOURNAMENT_START.toISOString());

  return NextResponse.json({ ...bonus, isLocked });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  if (now >= TOURNAMENT_START) {
    console.log('[bonus] POST - Torneo bloqueado. now:', now.toISOString(), 'start:', TOURNAMENT_START.toISOString());
    return NextResponse.json({ error: "El torneo ya ha comenzado. No se pueden modificar los bonus." }, { status: 400 });
  }

  console.log('[bonus] POST - Guardando bonus. now:', now.toISOString(), 'start:', TOURNAMENT_START.toISOString());
  const { topScorer, champion, spainResult, mvp } = await req.json();
  const userId = (session.user as any).id;

  const bonus = await prisma.userBonus.upsert({
    where: { userId },
    update: { topScorer, champion, spainResult, mvp },
    create: { userId, topScorer, champion, spainResult, mvp }
  });

  return NextResponse.json(bonus);
}
