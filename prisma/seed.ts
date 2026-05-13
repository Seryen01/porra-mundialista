import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import bcrypt from 'bcryptjs';

function toEmail(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ /g, '');
}

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
    const email = `${toEmail(name)}@porra.com`;
    const emailWithAccents = `${name.toLowerCase().replace(/ /g, '')}@porra.com`;

    // Migrate any existing record that was created with accented characters
    if (email !== emailWithAccents) {
      await prisma.user.updateMany({
        where: { email: emailWithAccents },
        data: { email },
      });
    }

    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        password,
        role: name === 'Rafaele' ? 'ADMIN' : 'USER',
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
