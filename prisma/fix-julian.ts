import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import bcrypt from 'bcryptjs';

async function main() {
  const correctEmail = 'julian@porra.com';
  const accentedEmail = 'julián@porra.com'; // julián@porra.com

  // 1. Try to rename the accented record
  const migrated = await prisma.user.updateMany({
    where: { email: accentedEmail },
    data: { email: correctEmail },
  });

  if (migrated.count > 0) {
    console.log(`OK: email actualizado ${accentedEmail} → ${correctEmail}`);
    return;
  }

  // 2. Already correct email exists — just reset the password to be safe
  const existing = await prisma.user.findUnique({ where: { email: correctEmail } });
  if (existing) {
    const newHash = await bcrypt.hash('porra2026', 10);
    await prisma.user.update({
      where: { email: correctEmail },
      data: { password: newHash },
    });
    console.log(`OK: contraseña de ${correctEmail} restablecida`);
    return;
  }

  // 3. Neither exists — create the user from scratch
  const password = await bcrypt.hash('porra2026', 10);
  await prisma.user.create({
    data: {
      name: 'Julián',
      email: correctEmail,
      password,
      role: 'USER',
    },
  });
  console.log(`OK: usuario creado → ${correctEmail}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
