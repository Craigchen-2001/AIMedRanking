import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const total = await prisma.paper.count();
  console.log(`總數: ${total}`);

  const byConf = await prisma.paper.groupBy({
    by: ['conference'],
    _count: { conference: true },
    orderBy: { _count: { conference: 'desc' } }
  });

  console.log('各會議數量:');
  byConf.forEach(c => {
    console.log(`${c.conference || '(空)'}: ${c._count.conference}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
