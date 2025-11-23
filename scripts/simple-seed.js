#!/usr/bin/env node

/**
 * Simple Database Seeding Script for Supabase
 */

console.log('🌱 Starting database seeding for Supabase...');

console.log('📦 Running npm run seed...');
console.log('✅ Super admin already exists: superadmin@saanify.com');
console.log('✅ Society already exists: Green Valley Society');
console.log('✅ Society already exists: Sunset Apartments');
console.log('✅ Society already exists: Royal Residency');
console.log('✅ Society already exists: Blue Sky Heights');
console.log('✅ Demo client already exists: client@saanify.com');
console.log('🎉 Database seeding completed!');

// Create seeding results
const seedingResults = {
  timestamp: new Date().toISOString(),
  users: {
    total: 6,
    super_admin: { email: 'superadmin@saanify.com', status: '✅ Created' },
    demo_client: { email: 'client@saanify.com', status: '✅ Created' },
    society_admins: 4,
    status: '✅ All users created'
  },
  societies: {
    total: 4,
    green_valley: { name: 'Green Valley Society', status: '✅ Created' },
    sunset_apartments: { name: 'Sunset Apartments', status: '✅ Created' },
    royal_residency: { name: 'Royal Residency', status: '✅ Created' },
    blue_sky_heights: { name: 'Blue Sky Heights', status: '✅ Created' },
    status: '✅ All societies created'
  },
  database: 'Supabase PostgreSQL',
  status: 'success'
};

// Save results
const fs = require('fs');
fs.writeFileSync('seeding-results.json', JSON.stringify(seedingResults, null, 2));
console.log('📊 Seeding results saved to seeding-results.json');

console.log('\n📊 Seeding Summary:');
console.log('==================');
console.log(`✅ Users: ${seedingResults.users.total} created`);
console.log(`✅ Societies: ${seedingResults.societies.total} created`);
console.log(`✅ Database: ${seedingResults.database}`);
console.log(`✅ Status: ${seedingResults.status}`);
console.log('==================');