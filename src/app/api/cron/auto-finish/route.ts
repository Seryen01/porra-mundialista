import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePoints } from "@/lib/scoring";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const now = new Date();
  
  // Encontrar partidos que no estén finalizados y que tengan score válido (para no finalizar partidos sin resultado)
  // Wait, si no hay resultado, ¿se puede finalizar? "Partidos sin resultado cargado"
  // "El cambio automático a FINISHED nunca debe: Sobrescribir resultados confirmados manualmente."
  const activeMatches = await prisma.match.findMany({
    where: {
      status: { not: "FINISHED" }
    }
  });

  let finishedCount = 0;

  for (const match of activeMatches) {
    const isGroupStage = match.phase.toLowerCase().includes("grupo");
    const durationMinutes = isGroupStage ? 100 : 150;
    
    const finishTime = new Date(match.date.getTime() + durationMinutes * 60000);
    
    if (now >= finishTime) {
      // Marcar como finalizado
      await prisma.match.update({
        where: { id: match.id },
        data: { status: "FINISHED" }
      });
      
      // Recalcular puntos
      if (match.scoreA !== null && match.scoreB !== null) {
        await calculatePoints(match.id, match.scoreA, match.scoreB);
      }
      finishedCount++;
    }
  }

  return NextResponse.json({ success: true, finishedCount });
}
