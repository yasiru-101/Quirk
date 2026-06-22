const prisma = require('./config/db');
const bcrypt = require('bcrypt');

async function main() {
  console.log('Seeding initial admin user...');
  const passwordHash = await bcrypt.hash('Password@123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@quirk.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@quirk.com',
      passwordHash: passwordHash,
      role: 'Admin',
      mustResetPassword: false,
      isActive: true,
    },
  });

  console.log('Successfully created initial admin user:', user.email);
  console.log('Password is: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
