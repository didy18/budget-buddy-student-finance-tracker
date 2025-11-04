import { db } from '@/db';
import { transactions } from '@/db/schema';

async function main() {
    const currentDate = new Date();
    const createdAt = currentDate.toISOString();
    
    const sampleTransactions = [
        // INCOME TRANSACTIONS
        {
            type: 'income',
            amount: 550.00,
            category: 'other',
            description: 'Part-time job salary - January',
            date: new Date(currentDate.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: createdAt,
        },
        {
            type: 'income',
            amount: 480.00,
            category: 'other',
            description: 'Part-time job salary - February',
            date: new Date(currentDate.getTime() - 31 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: createdAt,
        },
        {
            type: 'income',
            amount: 350.00,
            category: 'other',
            description: 'Monthly allowance from parents',
            date: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: createdAt,
        },
        {
            type: 'income',
            amount: 520.00,
            category: 'other',
            description: 'Part-time job salary - March',
            date: new Date(currentDate.getTime() - 17 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: createdAt,
        },
        {
            type: 'income',
            amount: 175.00,
            category: 'other',
            description: 'Freelance graphic design project',
            date: new Date(currentDate.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: createdAt,
        },

        // EXPENSE TRANSACTIONS - Food
        {
            type: 'expense',
            amount: 65.50,
            category: 'food',
            description: 'Weekly grocery shopping at Walmart',
            date: new Date(currentDate.getTime() - 50 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: createdAt,
        },
        {
            type: 'expense',
            amount: 22.75,
            category: 'food',
            description: 'Lunch at Chipotle with friends',
            date: new Date(currentDate.getTime() - 38 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: createdAt,
        },
        {
            type: 'expense',
            amount: 7.50,
            category: 'food',
            description: 'Coffee at campus cafe',
            date: new Date(currentDate.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: createdAt,
        },
        {
            type: 'expense',
            amount: 72.30,
            category: 'food',
            description: 'Weekly grocery shopping at Target',
            date: new Date(currentDate.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: createdAt,
        },

        // EXPENSE TRANSACTIONS - Transport
        {
            type: 'expense',
            amount: 75.00,
            category: 'transport',
            description: 'Monthly bus pass',
            date: new Date(currentDate.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: createdAt,
        },
        {
            type: 'expense',
            amount: 18.50,
            category: 'transport',
            description: 'Uber ride to downtown',
            date: new Date(currentDate.getTime() - 22 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: createdAt,
        },

        // EXPENSE TRANSACTIONS - Academic
        {
            type: 'expense',
            amount: 125.00,
            category: 'academic',
            description: 'Textbook for Computer Science',
            date: new Date(currentDate.getTime() - 55 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: createdAt,
        },
        {
            type: 'expense',
            amount: 32.50,
            category: 'academic',
            description: 'Notebooks and supplies',
            date: new Date(currentDate.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: createdAt,
        },

        // EXPENSE TRANSACTIONS - Entertainment
        {
            type: 'expense',
            amount: 15.00,
            category: 'entertainment',
            description: 'Movie ticket for latest Marvel film',
            date: new Date(currentDate.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: createdAt,
        },
        {
            type: 'expense',
            amount: 12.99,
            category: 'entertainment',
            description: 'Netflix subscription',
            date: new Date(currentDate.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: createdAt,
        },

        // EXPENSE TRANSACTIONS - Shopping
        {
            type: 'expense',
            amount: 45.00,
            category: 'shopping',
            description: 'New jeans from H&M',
            date: new Date(currentDate.getTime() - 33 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: createdAt,
        },

        // EXPENSE TRANSACTIONS - Utilities
        {
            type: 'expense',
            amount: 45.00,
            category: 'utilities',
            description: 'Monthly phone bill',
            date: new Date(currentDate.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: createdAt,
        },
    ];

    await db.insert(transactions).values(sampleTransactions);
    
    console.log('✅ Transactions seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});