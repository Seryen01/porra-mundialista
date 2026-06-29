import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  console.log('[matches-api] GET /api/matches called');
  const session = await getServerSession(authOptions);
  if (!session) {
    console.warn('[matches-api] Unauthorized — no session');
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const matches = await prisma.match.findMany({
      orderBy: { date: "asc" },
      include: {
        predictions: {
          where: { userId: (session.user as any).id },
        },
      },
    });

    console.log('[matches-api] Query OK', { count: matches.length, userId: (session.user as any).id });
    return NextResponse.json(matches);
  } catch (error) {
    console.error('[matches-api] DB query failed', error);
    return NextResponse.json({ error: "Error al cargar los partidos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { teamA, teamB, date, phase } = body;

  if (!teamA || !teamB || !date || !phase || isNaN(Date.parse(date))) {
    return NextResponse.json({ error: "Datos de partido inválidos" }, { status: 400 });
  }

  const match = await prisma.match.create({
    data: {
      teamA,
      teamB,
      date: new Date(date),
      phase,
    },
  });

  return NextResponse.json(match);
}
