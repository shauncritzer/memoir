// Quick script to check purchases table
import { getDb } from './server/db.js';

async function checkPurchases() {
  console.log('Connecting to database...\n');
  
  const db = await getDb();
  if (!db) {
    console.error('❌ Could not connect to database');
    process.exit(1);
  }

  console.log('✅ Connected to database\n');

  // Query purchases
  const { purchases } = await import('./drizzle/schema.js');
  const { desc } = await import('drizzle-orm');
  
  const allPurchases = await db
    .select({
      id: purchases.id,
      userId: purchases.userId,
      productId: purchases.productId,
      amount: purchases.amount,
      status: purchases.status,
      purchasedAt: purchases.purchasedAt,
      stripePaymentId: purchases.stripePaymentId,
    })
    .from(purchases)
    .orderBy(desc(purchases.purchasedAt))
    .limit(10);

  console.log('📊 Recent Purchases (last 10):\n');
  console.log('═══════════════════════════════════════════════════════════════');
  
  if (allPurchases.length === 0) {
    console.log('No purchases found in database.');
  } else {
    allPurchases.forEach((purchase, index) => {
      console.log(`\n${index + 1}. Purchase ID: ${purchase.id}`);
      console.log(`   User ID: ${purchase.userId}`);
      console.log(`   Product ID: "${purchase.productId}" ${purchase.productId === '7-day-reset' ? '✅' : '❌ WRONG!'}`);
      console.log(`   Amount: $${(purchase.amount / 100).toFixed(2)}`);
      console.log(`   Status: ${purchase.status}`);
      console.log(`   Purchased: ${purchase.purchasedAt}`);
      console.log(`   Stripe Payment: ${purchase.stripePaymentId}`);
    });
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  
  // Check for wrong product IDs
  const wrongIds = allPurchases.filter(p => p.productId !== '7-day-reset' && p.productId !== 'from-broken-to-whole' && p.productId !== 'bent-not-broken-circle');
  
  if (wrongIds.length > 0) {
    console.log('\n⚠️  Found purchases with incorrect product IDs:');
    wrongIds.forEach(p => {
      console.log(`   - Purchase ${p.id}: "${p.productId}" (should be "7-day-reset")`);
    });
  } else {
    console.log('\n✅ All product IDs look correct!');
  }
  
  process.exit(0);
}

checkPurchases().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
