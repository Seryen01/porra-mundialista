import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const name = "Luis Alberto";

  const user = await prisma.user.findFirst({ where: { name } });

  if (!user) {
    console.log(`No se encontró ningún usuario con nombre "${name}".`);
    return;
  }

  console.log(`Encontrado: ${user.name} (${user.email}) — id: ${user.id}`);

  // Las predicciones y el bonus se eliminan en cascada (onDelete: Cascade en schema)
  await prisma.user.delete({ where: { id: user.id } });

  console.log(`Usuario "${name}" y todos sus datos eliminados correctamente.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
