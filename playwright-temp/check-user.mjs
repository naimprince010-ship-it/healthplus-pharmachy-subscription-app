import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
try {
  const user = await prisma.user.findUnique({
    where: { email: 'naimprince010@gmail.com' },
    select: { id: true, email: true, role: true, phone: true },
  });
  console.log(JSON.stringify(user));
} catch (e) {
  console.error(e?.message || String(e));
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
