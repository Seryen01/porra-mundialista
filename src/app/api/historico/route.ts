import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet } from "@/lib/cache";
export const dynamic = "force-dynamic";

const CACHE_KEY = "historico:matches";
const CACHE_TTL_SECONDS = 120;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    console.log("[historico] Unauthorized request — no session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cached = cacheGet<object[]>(CACHE_KEY);
  if (cached) {
    console.log("[historico] Cache hit — returning cached matches", { count: cached.length });
    return NextResponse.json(cached);
  }

  console.log("[historico] Cache miss — querying DB for finished matches");
  try {
    const matches = await prisma.match.findMany({
      where: { status: "FINISHED" },
      orderBy: { date: "desc" },
      select: {
        id: true,
        teamA: true,
        teamB: true,
        date: true,
        phase: true,
        scoreA: true,
        scoreB: true,
        predictions: {
          select: {
            id: true,
            predictedScoreA: true,
            predictedScoreB: true,
            points: true,
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { points: "desc" },
        },
      },
    });

    console.log("[historico] DB query complete", { matchCount: matches.length });
    cacheSet(CACHE_KEY, matches, CACHE_TTL_SECONDS);
    return NextResponse.json(matches);
  } catch (error) {
    console.error("[historico] DB query failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
