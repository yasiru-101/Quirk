const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany();
  console.log(users.map(u => ({ 
    email: u.email, 
    emailVerified: u.emailVerified, 
    isActive: u.isActive,
    twoFactorEnabled: u.twoFactorEnabled 
  })));
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
