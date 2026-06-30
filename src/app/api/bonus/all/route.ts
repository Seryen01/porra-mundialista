import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TOURNAMENT_START } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only expose other users' predictions after the tournament has started
  const now = new Date();
  const visible = now >= TOURNAMENT_START;
  console.log('[bonus/all] GET - visible:', visible, 'now:', now.toISOString(), 'start:', TOURNAMENT_START.toISOString());
  if (!visible) return NextResponse.json({ visible: false, bonuses: [] });

  let bonuses: Awaited<ReturnType<typeof prisma.userBonus.findMany<{ include: { user: { select: { id: true; name: true; image: true } } } }>>>;
  try {
    bonuses = await prisma.userBonus.findMany({
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { user: { name: "asc" } },
    });
  } catch (error) {
    console.error('[bonus/all] DB error', error);
    return NextResponse.json({ error: "Error al cargar bonus" }, { status: 500 });
  }

  return NextResponse.json({
    visible: true,
    bonuses: bonuses.map((b) => ({
      userId: b.user.id,
      userName: b.user.name,
      userImage: b.user.image,
      topScorer: b.topScorer || null,
      champion: b.champion || null,
      spainResult: b.spainResult || null,
      mvp: b.mvp || null,
    })),
  });
}
