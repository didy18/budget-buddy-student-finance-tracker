import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { budgets } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single budget by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const budget = await db
        .select()
        .from(budgets)
        .where(eq(budgets.id, parseInt(id)))
        .limit(1);

      if (budget.length === 0) {
        return NextResponse.json(
          { error: 'Budget not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(budget[0], { status: 200 });
    }

    // List all budgets with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const period = searchParams.get('period');

    let query = db.select().from(budgets).orderBy(desc(budgets.startDate));

    // Filter by period if provided
    if (period) {
      if (period !== 'weekly' && period !== 'monthly') {
        return NextResponse.json(
          { error: 'Period must be either "weekly" or "monthly"', code: 'INVALID_PERIOD' },
          { status: 400 }
        );
      }
      query = query.where(eq(budgets.period, period));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { period, amount, startDate, categoryLimits, alertThreshold } = body;

    // Validate required fields
    if (!period) {
      return NextResponse.json(
        { error: 'Period is required', code: 'MISSING_PERIOD' },
        { status: 400 }
      );
    }

    if (period !== 'weekly' && period !== 'monthly') {
      return NextResponse.json(
        { error: 'Period must be either "weekly" or "monthly"', code: 'INVALID_PERIOD' },
        { status: 400 }
      );
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'Amount is required', code: 'MISSING_AMOUNT' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number', code: 'INVALID_AMOUNT' },
        { status: 400 }
      );
    }

    if (!startDate) {
      return NextResponse.json(
        { error: 'Start date is required', code: 'MISSING_START_DATE' },
        { status: 400 }
      );
    }

    // Validate startDate is a valid ISO string
    try {
      new Date(startDate).toISOString();
    } catch {
      return NextResponse.json(
        { error: 'Start date must be a valid ISO timestamp string', code: 'INVALID_START_DATE' },
        { status: 400 }
      );
    }

    if (alertThreshold === undefined || alertThreshold === null) {
      return NextResponse.json(
        { error: 'Alert threshold is required', code: 'MISSING_ALERT_THRESHOLD' },
        { status: 400 }
      );
    }

    if (typeof alertThreshold !== 'number' || !Number.isInteger(alertThreshold) || alertThreshold < 0 || alertThreshold > 100) {
      return NextResponse.json(
        { error: 'Alert threshold must be an integer between 0 and 100', code: 'INVALID_ALERT_THRESHOLD' },
        { status: 400 }
      );
    }

    // Validate categoryLimits if provided
    if (categoryLimits !== undefined && categoryLimits !== null) {
      if (typeof categoryLimits !== 'object' || Array.isArray(categoryLimits)) {
        return NextResponse.json(
          { error: 'Category limits must be a valid JSON object', code: 'INVALID_CATEGORY_LIMITS' },
          { status: 400 }
        );
      }
    }

    // Insert new budget
    const newBudget = await db
      .insert(budgets)
      .values({
        period,
        amount,
        startDate,
        categoryLimits: categoryLimits || null,
        alertThreshold,
      })
      .returning();

    return NextResponse.json(newBudget[0], { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if budget exists
    const existing = await db
      .select()
      .from(budgets)
      .where(eq(budgets.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { period, amount, startDate, categoryLimits, alertThreshold } = body;

    // Validate period if provided
    if (period !== undefined && period !== 'weekly' && period !== 'monthly') {
      return NextResponse.json(
        { error: 'Period must be either "weekly" or "monthly"', code: 'INVALID_PERIOD' },
        { status: 400 }
      );
    }

    // Validate amount if provided
    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return NextResponse.json(
        { error: 'Amount must be a positive number', code: 'INVALID_AMOUNT' },
        { status: 400 }
      );
    }

    // Validate startDate if provided
    if (startDate !== undefined) {
      try {
        new Date(startDate).toISOString();
      } catch {
        return NextResponse.json(
          { error: 'Start date must be a valid ISO timestamp string', code: 'INVALID_START_DATE' },
          { status: 400 }
        );
      }
    }

    // Validate alertThreshold if provided
    if (alertThreshold !== undefined && (typeof alertThreshold !== 'number' || !Number.isInteger(alertThreshold) || alertThreshold < 0 || alertThreshold > 100)) {
      return NextResponse.json(
        { error: 'Alert threshold must be an integer between 0 and 100', code: 'INVALID_ALERT_THRESHOLD' },
        { status: 400 }
      );
    }

    // Validate categoryLimits if provided
    if (categoryLimits !== undefined && categoryLimits !== null) {
      if (typeof categoryLimits !== 'object' || Array.isArray(categoryLimits)) {
        return NextResponse.json(
          { error: 'Category limits must be a valid JSON object', code: 'INVALID_CATEGORY_LIMITS' },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields
    const updates: any = {};
    if (period !== undefined) updates.period = period;
    if (amount !== undefined) updates.amount = amount;
    if (startDate !== undefined) updates.startDate = startDate;
    if (categoryLimits !== undefined) updates.categoryLimits = categoryLimits;
    if (alertThreshold !== undefined) updates.alertThreshold = alertThreshold;

    // Update budget
    const updated = await db
      .update(budgets)
      .set(updates)
      .where(eq(budgets.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if budget exists
    const existing = await db
      .select()
      .from(budgets)
      .where(eq(budgets.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    // Delete budget
    const deleted = await db
      .delete(budgets)
      .where(eq(budgets.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Budget deleted successfully',
        deleted: deleted[0],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}