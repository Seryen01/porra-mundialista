import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const matches = await prisma.match.findMany({
    orderBy: { date: "asc" },
    include: {
      predictions: {
        where: { userId: (session.user as any).id },
      },
    },
  });

  return NextResponse.json(matches);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { teamA, teamB, date, phase } = body;

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
