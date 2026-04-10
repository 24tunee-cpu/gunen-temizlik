const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Admin credentials from environment variables or defaults
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gunentemizlik.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';

async function main() {
  try {
    console.log('🔍 Checking for existing admin user...');

    // Check if admin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists:', ADMIN_EMAIL);
      console.log('   Role:', existingAdmin.role);
      console.log('   Created:', existingAdmin.createdAt?.toISOString() || 'N/A');
      return { created: false, email: ADMIN_EMAIL };
    }

    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    console.log('👤 Creating admin user...');
    const admin = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Email:', admin.email);
    console.log('   Name:', admin.name);
    console.log('   Role:', admin.role);
    console.log('   ID:', admin.id);

    return { created: true, email: ADMIN_EMAIL, id: admin.id };
  } catch (error) {
    console.error('❌ Error creating admin user:');
    console.error(error instanceof Error ? error.message : error);
    throw error;
  }
}

main()
  .then((result) => {
    console.log('\n🎉 Done!');
    if (result.created) {
      console.log('   Login with:', result.email);
    }
    process.exit(0);
  })
  .catch((e) => {
    console.error('\n💥 Failed to create admin user');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  });
