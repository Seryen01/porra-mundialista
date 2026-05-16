import "dotenv/config";
import { prisma } from "../src/lib/prisma";

// Maps calendar name variants → DB names
const nameMap: Record<string, string> = {
  "Corea del Sur":  "República de Corea",
  "Rep. Checa":     "Chequia",
  "Qatar":          "Catar",
  "Curazao":        "Curasao",
  "Iraq":           "Irak",
};
const n = (s: string) => nameMap[s] ?? s;

// Source of truth: calendar times in CEST (UTC+2) → converted to UTC (subtract 2h)
// [teamA, teamB, UTC_ISO]
const cal: [string, string, string][] = [
  // === MD1 (Jun 11–17) ===
  ["México",                 "Sudáfrica",            "2026-06-11T19:00:00Z"],
  ["Corea del Sur",          "Rep. Checa",           "2026-06-12T02:00:00Z"],
  ["Canadá",                 "Bosnia y Herzegovina", "2026-06-12T19:00:00Z"],
  ["Estados Unidos",         "Paraguay",             "2026-06-13T01:00:00Z"],
  ["Qatar",                  "Suiza",                "2026-06-13T16:00:00Z"],
  ["Brasil",                 "Marruecos",            "2026-06-13T22:00:00Z"],
  ["Haití",                  "Escocia",              "2026-06-14T16:00:00Z"],
  ["Alemania",               "Curazao",              "2026-06-14T19:00:00Z"],
  ["Países Bajos",           "Japón",                "2026-06-14T22:00:00Z"],
  ["Australia",              "Turquía",              "2026-06-15T01:00:00Z"],
  ["Costa de Marfil",        "Ecuador",              "2026-06-15T16:00:00Z"],
  ["Suecia",                 "Túnez",                "2026-06-15T19:00:00Z"],
  ["España",                 "Cabo Verde",           "2026-06-15T22:00:00Z"],
  ["Bélgica",                "Egipto",               "2026-06-16T01:00:00Z"],
  ["Francia",                "Senegal",              "2026-06-16T16:00:00Z"],
  ["Iraq",                   "Noruega",              "2026-06-16T19:00:00Z"],
  ["Arabia Saudí",           "Uruguay",              "2026-06-16T22:00:00Z"],
  ["Irán",                   "Nueva Zelanda",        "2026-06-17T01:00:00Z"],
  ["Portugal",               "RD Congo",             "2026-06-17T16:00:00Z"],
  ["Inglaterra",             "Croacia",              "2026-06-17T19:00:00Z"],
  ["Argentina",              "Argelia",              "2026-06-17T22:00:00Z"],
  ["Austria",                "Jordania",             "2026-06-18T01:00:00Z"],

  // === MD2 (Jun 18–24) ===
  ["Rep. Checa",             "Sudáfrica",            "2026-06-18T16:00:00Z"],
  ["Suiza",                  "Bosnia y Herzegovina", "2026-06-18T19:00:00Z"],
  ["Ghana",                  "Panamá",               "2026-06-18T22:00:00Z"],
  ["Uzbekistán",             "Colombia",             "2026-06-19T01:00:00Z"],
  ["Estados Unidos",         "Australia",            "2026-06-19T19:00:00Z"],
  ["Canadá",                 "Qatar",                "2026-06-19T22:00:00Z"],
  ["México",                 "Corea del Sur",        "2026-06-20T01:00:00Z"],
  ["Países Bajos",           "Suecia",               "2026-06-20T16:00:00Z"],
  ["Alemania",               "Costa de Marfil",      "2026-06-20T19:00:00Z"],
  ["Escocia",                "Marruecos",            "2026-06-20T22:00:00Z"],
  ["Brasil",                 "Haití",                "2026-06-21T00:30:00Z"],
  ["Turquía",                "Paraguay",             "2026-06-21T03:00:00Z"],
  ["España",                 "Arabia Saudí",         "2026-06-21T16:00:00Z"],
  ["Bélgica",                "Irán",                 "2026-06-21T19:00:00Z"],
  ["Ecuador",                "Curazao",              "2026-06-22T00:00:00Z"],
  ["Túnez",                  "Japón",                "2026-06-22T04:00:00Z"],
  ["Francia",                "Iraq",                 "2026-06-22T16:00:00Z"],
  ["Uruguay",                "Cabo Verde",           "2026-06-22T22:00:00Z"],
  ["Nueva Zelanda",          "Egipto",               "2026-06-23T01:00:00Z"],
  ["Portugal",               "Uzbekistán",           "2026-06-23T16:00:00Z"],
  ["Noruega",                "Senegal",              "2026-06-23T22:00:00Z"],
  ["Argentina",              "Austria",              "2026-06-24T01:00:00Z"],
  ["Jordania",               "Argelia",              "2026-06-24T04:00:00Z"],
  ["Inglaterra",             "Ghana",                "2026-06-24T16:00:00Z"],
  ["Panamá",                 "Croacia",              "2026-06-24T19:00:00Z"],
  ["Colombia",               "RD Congo",             "2026-06-24T22:00:00Z"],
  ["Sudáfrica",              "Corea del Sur",        "2026-06-24T22:00:00Z"],

  // === MD3 (Jun 25–28) ===
  ["Suiza",                  "Canadá",               "2026-06-25T16:00:00Z"],
  ["Bosnia y Herzegovina",   "Qatar",                "2026-06-25T16:00:00Z"],
  ["Escocia",                "Brasil",               "2026-06-25T19:00:00Z"],
  ["Marruecos",              "Haití",                "2026-06-25T19:00:00Z"],
  ["México",                 "Rep. Checa",           "2026-06-26T01:00:00Z"],
  ["Japón",                  "Suecia",               "2026-06-26T16:00:00Z"],
  ["Túnez",                  "Países Bajos",         "2026-06-26T16:00:00Z"],
  ["Curazao",                "Costa de Marfil",      "2026-06-26T19:00:00Z"],
  ["Ecuador",                "Alemania",             "2026-06-26T19:00:00Z"],
  ["Estados Unidos",         "Turquía",              "2026-06-26T22:00:00Z"],
  ["Paraguay",               "Australia",            "2026-06-26T22:00:00Z"],
  ["Senegal",                "Iraq",                 "2026-06-27T17:00:00Z"],
  ["Noruega",                "Francia",              "2026-06-27T17:00:00Z"],
  ["Argelia",                "Austria",              "2026-06-27T20:00:00Z"],
  ["Jordania",               "Argentina",            "2026-06-27T20:00:00Z"],
  ["Egipto",                 "Irán",                 "2026-06-27T22:00:00Z"],
  ["Nueva Zelanda",          "Bélgica",              "2026-06-27T22:00:00Z"],
  ["Uruguay",                "España",               "2026-06-28T00:00:00Z"],
  ["Cabo Verde",             "Arabia Saudí",         "2026-06-28T00:00:00Z"],
  ["RD Congo",               "Uzbekistán",           "2026-06-27T23:00:00Z"],
  ["Colombia",               "Portugal",             "2026-06-27T23:00:00Z"],
  ["Croacia",                "Ghana",                "2026-06-28T02:00:00Z"],
  ["Panamá",                 "Inglaterra",           "2026-06-28T02:00:00Z"],
];

async function main() {
  let updated = 0;
  let unchanged = 0;
  let notFound = 0;

  for (const [calA, calB, iso] of cal) {
    const dbA = n(calA);
    const dbB = n(calB);
    const newDate = new Date(iso);

    const result = await prisma.match.updateMany({
      where: {
        OR: [
          { teamA: dbA, teamB: dbB },
          { teamA: dbB, teamB: dbA },
        ],
        date: { not: newDate },
      },
      data: { date: newDate },
    });

    if (result.count > 0) {
      console.log(`✅ ${dbA} vs ${dbB} → ${iso}`);
      updated += result.count;
    } else {
      // Check if already correct or truly not found
      const exists = await prisma.match.count({
        where: {
          OR: [
            { teamA: dbA, teamB: dbB },
            { teamA: dbB, teamB: dbA },
          ],
        },
      });
      if (exists > 0) {
        console.log(`⏭  ${dbA} vs ${dbB} ya tiene fecha correcta`);
        unchanged++;
      } else {
        console.log(`❌ NO ENCONTRADO: ${dbA} vs ${dbB}`);
        notFound++;
      }
    }
  }

  console.log(`\nResumen: ✅ actualizados=${updated}  ⏭ sin cambio=${unchanged}  ❌ no encontrados=${notFound}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
