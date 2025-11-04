import { db } from '@/db';
import { reminders } from '@/db/schema';

async function main() {
    const now = new Date();
    
    const sampleReminders = [
        {
            title: 'Tuition Payment Deadline',
            description: 'Pay spring semester tuition fee - $3,500 due',
            dueDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
            isCompleted: false,
            category: 'academic',
        },
        {
            title: 'Pay Phone Bill',
            description: 'Monthly phone bill payment - $45',
            dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            isCompleted: false,
            category: 'utilities',
        },
        {
            title: 'Rent Payment',
            description: 'Monthly rent for shared apartment - $600',
            dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            isCompleted: false,
            category: 'housing',
        },
        {
            title: 'Return Library Books',
            description: 'Return borrowed textbooks to avoid late fees',
            dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            isCompleted: true,
            category: 'academic',
        },
        {
            title: 'Weekly Grocery Shopping',
            description: 'Buy groceries for the week - budget $60',
            dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            isCompleted: false,
            category: 'food',
        },
        {
            title: 'Credit Card Payment',
            description: 'Pay minimum credit card payment - $50',
            dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            isCompleted: false,
            category: null,
        },
        {
            title: 'Health Insurance Renewal',
            description: 'Renew student health insurance plan',
            dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            isCompleted: false,
            category: 'health',
        },
        {
            title: 'Buy Concert Tickets',
            description: 'Purchase tickets for concert - $40',
            dueDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            isCompleted: true,
            category: 'entertainment',
        },
    ];

    await db.insert(reminders).values(sampleReminders);
    
    console.log('✅ Reminders seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});