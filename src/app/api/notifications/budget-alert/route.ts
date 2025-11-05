import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { budgets, transactions, user } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

// Email service configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'notifications@budgetbuddy.com';

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured - email notification skipped');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Email send failed:', error);
      return { success: false, error };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, budgetId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!budgetId) {
      return NextResponse.json(
        { error: 'Budget ID is required' },
        { status: 400 }
      );
    }

    // Get budget details
    const budget = await db
      .select()
      .from(budgets)
      .where(and(
        eq(budgets.id, parseInt(budgetId)),
        eq(budgets.userId, userId)
      ))
      .limit(1);

    if (budget.length === 0) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    const currentBudget = budget[0];

    // Calculate expenses for current budget period
    const startDate = new Date(currentBudget.startDate);
    const endDate = new Date(startDate);
    
    if (currentBudget.period === 'weekly') {
      endDate.setDate(endDate.getDate() + 7);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Get transactions in the budget period
    const budgetTransactions = await db
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'expense'),
        gte(transactions.date, startDate.toISOString()),
        lte(transactions.date, endDate.toISOString())
      ));

    const totalExpenses = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);
    const budgetProgress = (totalExpenses / currentBudget.amount) * 100;

    // Check if alert threshold is reached
    if (budgetProgress < currentBudget.alertThreshold) {
      return NextResponse.json({
        message: 'Alert threshold not reached yet',
        budgetProgress,
        alertThreshold: currentBudget.alertThreshold,
      });
    }

    // Get user email
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord.length === 0 || !userRecord[0].email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 404 }
      );
    }

    const userEmail = userRecord[0].email;
    const userName = userRecord[0].name || 'User';

    // Send email notification
    const emailSubject = '⚠️ Budget Alert: Spending Threshold Reached';
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .stats { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .stat-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .stat-label { color: #6b7280; }
            .stat-value { font-weight: bold; color: #111827; }
            .progress-bar { background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden; margin: 20px 0; }
            .progress-fill { background: ${budgetProgress >= 100 ? '#ef4444' : '#f59e0b'}; height: 100%; transition: width 0.3s ease; }
            .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Budget Alert</h1>
              <p>You've reached your spending threshold</p>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              
              <div class="alert-box">
                <strong>⚠️ Alert:</strong> You've reached ${budgetProgress.toFixed(0)}% of your ${currentBudget.period} budget.
              </div>

              <div class="stats">
                <h3>Budget Summary</h3>
                <div class="stat-row">
                  <span class="stat-label">Budget Amount:</span>
                  <span class="stat-value">$${currentBudget.amount.toFixed(2)}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">Total Spent:</span>
                  <span class="stat-value">$${totalExpenses.toFixed(2)}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">Remaining:</span>
                  <span class="stat-value">$${Math.max(0, currentBudget.amount - totalExpenses).toFixed(2)}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">Period:</span>
                  <span class="stat-value">${currentBudget.period.charAt(0).toUpperCase() + currentBudget.period.slice(1)}</span>
                </div>
              </div>

              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(budgetProgress, 100)}%"></div>
              </div>

              <p><strong>Tips to stay on track:</strong></p>
              <ul>
                <li>Review your recent transactions for unnecessary spending</li>
                <li>Consider cutting back on non-essential expenses</li>
                <li>Set daily spending limits for the rest of the period</li>
                <li>Track your expenses more frequently</li>
              </ul>

              <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/budget" class="cta-button">
                  View Budget Details
                </a>
              </center>

              <div class="footer">
                <p>Budget Buddy - Your Personal Finance Tracker</p>
                <p>You're receiving this because you've set up budget alerts in your account.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResult = await sendEmail(userEmail, emailSubject, emailHtml);

    if (emailResult.success) {
      return NextResponse.json({
        message: 'Budget alert email sent successfully',
        budgetProgress,
        alertThreshold: currentBudget.alertThreshold,
        emailSent: true,
      });
    } else {
      return NextResponse.json({
        message: 'Budget alert processed but email failed',
        budgetProgress,
        alertThreshold: currentBudget.alertThreshold,
        emailSent: false,
        emailError: emailResult.error,
      }, { status: 207 });
    }

  } catch (error: any) {
    console.error('Budget alert error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get all active budgets for the user
    const userBudgets = await db
      .select()
      .from(budgets)
      .where(eq(budgets.userId, userId))
      .orderBy(desc(budgets.startDate));

    const alerts = [];

    for (const budget of userBudgets) {
      const startDate = new Date(budget.startDate);
      const endDate = new Date(startDate);
      
      if (budget.period === 'weekly') {
        endDate.setDate(endDate.getDate() + 7);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      const now = new Date();
      
      // Only check active budgets
      if (now < startDate || now > endDate) {
        continue;
      }

      // Get transactions in the budget period
      const budgetTransactions = await db
        .select()
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, startDate.toISOString()),
          lte(transactions.date, endDate.toISOString())
        ));

      const totalExpenses = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);
      const budgetProgress = (totalExpenses / budget.amount) * 100;

      if (budgetProgress >= budget.alertThreshold) {
        alerts.push({
          budgetId: budget.id,
          period: budget.period,
          budgetAmount: budget.amount,
          totalExpenses,
          budgetProgress,
          alertThreshold: budget.alertThreshold,
          shouldAlert: true,
        });
      }
    }

    return NextResponse.json({
      userId,
      alertsFound: alerts.length,
      alerts,
    });

  } catch (error: any) {
    console.error('Budget check error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
