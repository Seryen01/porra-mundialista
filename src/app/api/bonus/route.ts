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

  return NextResponse.json(bonus || {});
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (new Date() >= TOURNAMENT_START) {
    return NextResponse.json({ error: "El torneo ya ha comenzado. No se pueden modificar los bonus." }, { status: 400 });
  }

  const { topScorer, champion, spainResult, mvp } = await req.json();
  const userId = (session.user as any).id;

  const bonus = await prisma.userBonus.upsert({
    where: { userId },
    update: { topScorer, champion, spainResult, mvp },
    create: { userId, topScorer, champion, spainResult, mvp }
  });

  return NextResponse.json(bonus);
}
