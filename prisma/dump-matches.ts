import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const matches = await prisma.match.findMany({ orderBy: { date: "asc" } });
  for (const m of matches) {
    const d = new Date(m.date);
    // Show UTC and ET (UTC-4 in summer)
    const utcStr = d.toISOString().replace('T',' ').substring(0,16);
    const etHour = ((d.getUTCHours() - 4 + 24) % 24).toString().padStart(2,'0');
    const etMin = d.getUTCMinutes().toString().padStart(2,'0');
    // ET date (if hour < 4 UTC, ET date is previous day)
    const etDate = new Date(d.getTime() - 4*3600*1000);
    const etDateStr = etDate.toISOString().substring(0,10);
    console.log(`${m.teamA} v ${m.teamB} | ${m.phase} | UTC: ${utcStr} | ET: ${etDateStr} ${etHour}:${etMin}`);
  }
  console.log(`\nTotal: ${matches.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
