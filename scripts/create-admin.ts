import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createLogger } from '@/lib/logger';

const logger = createLogger('scripts/create-admin');

// Admin credentials from environment variables or defaults
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gunentemizlik.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';

function validateRuntimeConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) return;

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_NAME) {
    throw new Error('In production, ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_NAME must be set');
  }

  if (ADMIN_PASSWORD === 'admin123') {
    throw new Error('Default admin password is not allowed in production');
  }
}

interface CreateAdminResult {
  created: boolean;
  email: string;
  id?: string;
}

async function main(): Promise<CreateAdminResult> {
  try {
    validateRuntimeConfig();
    logger.info('Checking for existing admin user', { email: ADMIN_EMAIL });

    // Check if admin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (existingAdmin) {
      logger.info('Admin user already exists', {
        email: ADMIN_EMAIL,
        role: existingAdmin.role,
        createdAt: existingAdmin.createdAt?.toISOString()
      });
      return { created: false, email: ADMIN_EMAIL };
    }

    logger.info('Hashing password...');
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    logger.info('Creating admin user...', { email: ADMIN_EMAIL });
    const admin = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    logger.info('Admin user created successfully', {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });

    return { created: true, email: ADMIN_EMAIL, id: admin.id };
  } catch (error) {
    logger.error('Failed to create admin user', {}, error instanceof Error ? error : undefined);
    throw error;
  }
}

main()
  .then((result) => {
    logger.info('Script completed', { created: result.created, email: result.email });
    if (result.created) {
      console.log('✅ Admin created. Login with:', result.email);
    } else {
      console.log('ℹ️  Admin already exists:', result.email);
    }
    process.exit(0);
  })
  .catch((e) => {
    logger.error('Script failed', {}, e instanceof Error ? e : undefined);
    console.error('💥 Failed:', e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  });
