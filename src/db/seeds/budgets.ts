import { db } from '@/db';
import { budgets } from '@/db/schema';

async function main() {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const currentDay = now.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay;
    const currentWeekMonday = new Date(now);
    currentWeekMonday.setDate(now.getDate() + diff);
    currentWeekMonday.setHours(0, 0, 0, 0);

    const sampleBudgets = [
        {
            period: 'monthly',
            amount: 1000.00,
            startDate: currentMonth.toISOString(),
            alertThreshold: 80,
            categoryLimits: {
                food: 300,
                transport: 100,
                academic: 150,
                entertainment: 100,
                shopping: 150,
                utilities: 80,
                health: 50,
                housing: 0,
                other: 70
            },
        },
        {
            period: 'monthly',
            amount: 950.00,
            startDate: previousMonth.toISOString(),
            alertThreshold: 75,
            categoryLimits: {
                food: 280,
                transport: 90,
                academic: 140,
                entertainment: 90,
                shopping: 140,
                utilities: 75,
                health: 50,
                housing: 0,
                other: 85
            },
        },
        {
            period: 'weekly',
            amount: 200.00,
            startDate: currentWeekMonday.toISOString(),
            alertThreshold: 85,
            categoryLimits: null,
        }
    ];

    await db.insert(budgets).values(sampleBudgets);
    
    console.log('✅ Budgets seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});