import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { users, teams, teamMembers } from './schema';
import { hashPassword } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';

async function createStripeProducts() {
  console.log('Creating Stripe products and prices...');

  const baseProduct = await stripe.products.create({
    name: 'Base',
    description: 'Base subscription plan',
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  console.log('Stripe products and prices created successfully.');
}

async function seed() {
  // Create default admin user
  const adminEmail = 'max12567@gmail.com';
  const adminPassword = 'max12567@gmail.com';

  // Check if admin user already exists
  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  });

  if (existingAdmin) {
    console.log('Default admin user already exists:', adminEmail);
  } else {
    const adminPasswordHash = await hashPassword(adminPassword);

    const [adminUser] = await db
      .insert(users)
      .values([
        {
          email: adminEmail,
          passwordHash: adminPasswordHash,
          role: "admin",
          approvalStatus: "approved",
          approvedAt: new Date(),
        },
      ])
      .returning();

    console.log('Default admin user created:', adminEmail);

    const [adminTeam] = await db
      .insert(teams)
      .values({
        name: 'Admin Team',
      })
      .returning();

    await db.insert(teamMembers).values({
      teamId: adminTeam.id,
      userId: adminUser.id,
      role: 'owner',
    });
  }

  await createStripeProducts();
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
