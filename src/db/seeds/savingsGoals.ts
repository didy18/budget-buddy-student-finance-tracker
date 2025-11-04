import { db } from '@/db';
import { savingsGoals } from '@/db/schema';

async function main() {
    const now = new Date();
    
    const sampleGoals = [
        {
            name: 'New Laptop',
            targetAmount: 1200.00,
            currentAmount: 450.00,
            deadline: new Date(now.getFullYear(), now.getMonth() + 6, now.getDate()).toISOString(),
            description: 'Saving for a new MacBook Air for design work and classes',
            createdAt: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString(),
        },
        {
            name: 'Spring Break Trip',
            targetAmount: 500.00,
            currentAmount: 180.00,
            deadline: new Date(now.getFullYear(), now.getMonth() + 4, now.getDate()).toISOString(),
            description: 'Trip to Miami with friends during spring break',
            createdAt: new Date(now.getFullYear(), now.getMonth() - 2, now.getDate()).toISOString(),
        },
        {
            name: 'Emergency Fund',
            targetAmount: 1000.00,
            currentAmount: 320.00,
            deadline: null,
            description: 'Building an emergency fund for unexpected expenses',
            createdAt: new Date(now.getFullYear(), now.getMonth() - 5, now.getDate()).toISOString(),
        },
        {
            name: 'New Smartphone',
            targetAmount: 800.00,
            currentAmount: 100.00,
            deadline: new Date(now.getFullYear(), now.getMonth() + 8, now.getDate()).toISOString(),
            description: 'Saving for iPhone upgrade when contract ends',
            createdAt: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString(),
        }
    ];

    await db.insert(savingsGoals).values(sampleGoals);
    
    console.log('✅ Savings goals seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});