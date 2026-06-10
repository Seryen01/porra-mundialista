import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const user = await prisma.user.findFirst({ where: { name } });
  if (!user) return NextResponse.json({ error: `Usuario "${name}" no encontrado` }, { status: 404 });

  await prisma.user.delete({ where: { id: user.id } });
  console.log(`[admin-delete-user] Usuario eliminado: ${user.name} (${user.email})`);

  return NextResponse.json({ success: true, deleted: { name: user.name, email: user.email } });
}
