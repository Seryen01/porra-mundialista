import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculatePoints } from "@/lib/scoring";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  const body = await req.json();
  const { scoreA, scoreB, status } = body;

  const match = await prisma.match.update({
    where: { id },
    data: {
      scoreA: scoreA !== undefined ? parseInt(scoreA) : undefined,
      scoreB: scoreB !== undefined ? parseInt(scoreB) : undefined,
      status: status || undefined,
    },
  });

  if (status === "FINISHED" && scoreA !== undefined && scoreB !== undefined) {
    await calculatePoints(id, parseInt(scoreA), parseInt(scoreB));
  }

  return NextResponse.json(match);
}
