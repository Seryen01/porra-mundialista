import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import bcrypt from 'bcryptjs';

async function main() {
  const password = await bcrypt.hash('porra2026', 10);
  const users = [
    'Rafaele',
    'Diny',
    'Mairi',
    'Manu',
    'Julián',
    'Sergio',
    'Luis Alberto',
  ];

  for (const name of users) {
    const email = `${name.toLowerCase().replace(' ', '')}@porra.com`;
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        password,
        role: name === 'Rafaele' ? 'ADMIN' : 'USER', // Making Rafaele admin by default
      },
    });
  }

  console.log('Seed completed: Users created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
