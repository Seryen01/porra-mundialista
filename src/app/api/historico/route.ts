import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet } from "@/lib/cache";
export const dynamic = "force-dynamic";

const CACHE_KEY = "historico:matches";
const CACHE_TTL_SECONDS = 120;

export async function GET() {
  console.log("[historico] GET start");

  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error("[historico] getServerSession threw", error);
    return NextResponse.json({ error: "Auth error" }, { status: 500 });
  }

  if (!session) {
    console.log("[historico] Unauthorized — no session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log("[historico] Session OK, checking cache");

  const cached = cacheGet<object[]>(CACHE_KEY);
  if (cached) {
    console.log("[historico] Cache hit", { count: cached.length });
    return NextResponse.json(cached);
  }

  console.log("[historico] Cache miss — querying DB");
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

    console.log("[historico] DB query OK", { matchCount: matches.length });
    cacheSet(CACHE_KEY, matches, CACHE_TTL_SECONDS);
    return NextResponse.json(matches);
  } catch (error) {
    console.error("[historico] DB query failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
