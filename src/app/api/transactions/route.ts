import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { eq, like, and, gte, lte, desc } from 'drizzle-orm';

const VALID_TYPES = ['income', 'expense'];
const VALID_CATEGORIES = ['food', 'transport', 'academic', 'entertainment', 'shopping', 'utilities', 'health', 'housing', 'other'];

function validateType(type: string): boolean {
  return VALID_TYPES.includes(type);
}

function validateCategory(category: string): boolean {
  return VALID_CATEGORIES.includes(category);
}

function validateAmount(amount: number): boolean {
  return typeof amount === 'number' && amount > 0;
}

function validateDate(date: string): boolean {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single transaction by ID
    if (id) {
      if (!id || isNaN(parseInt(id)) || parseInt(id) <= 0) {
        return NextResponse.json({
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        }, { status: 400 });
      }

      const transaction = await db.select()
        .from(transactions)
        .where(eq(transactions.id, parseInt(id)))
        .limit(1);

      if (transaction.length === 0) {
        return NextResponse.json({
          error: 'Transaction not found'
        }, { status: 404 });
      }

      return NextResponse.json(transaction[0], { status: 200 });
    }

    // List transactions with filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query conditions
    const conditions = [];

    if (search) {
      conditions.push(like(transactions.description, `%${search}%`));
    }

    if (type) {
      if (!validateType(type)) {
        return NextResponse.json({
          error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
          code: 'INVALID_TYPE'
        }, { status: 400 });
      }
      conditions.push(eq(transactions.type, type));
    }

    if (category) {
      if (!validateCategory(category)) {
        return NextResponse.json({
          error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
          code: 'INVALID_CATEGORY'
        }, { status: 400 });
      }
      conditions.push(eq(transactions.category, category));
    }

    if (startDate) {
      if (!validateDate(startDate)) {
        return NextResponse.json({
          error: 'Invalid startDate format. Must be a valid ISO timestamp',
          code: 'INVALID_START_DATE'
        }, { status: 400 });
      }
      conditions.push(gte(transactions.date, startDate));
    }

    if (endDate) {
      if (!validateDate(endDate)) {
        return NextResponse.json({
          error: 'Invalid endDate format. Must be a valid ISO timestamp',
          code: 'INVALID_END_DATE'
        }, { status: 400 });
      }
      conditions.push(lte(transactions.date, endDate));
    }

    let query = db.select().from(transactions);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(transactions.date))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, amount, category, description, date } = body;

    // Validate required fields
    if (!type) {
      return NextResponse.json({
        error: 'Type is required',
        code: 'MISSING_TYPE'
      }, { status: 400 });
    }

    if (!validateType(type)) {
      return NextResponse.json({
        error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
        code: 'INVALID_TYPE'
      }, { status: 400 });
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json({
        error: 'Amount is required',
        code: 'MISSING_AMOUNT'
      }, { status: 400 });
    }

    if (!validateAmount(amount)) {
      return NextResponse.json({
        error: 'Amount must be a positive number',
        code: 'INVALID_AMOUNT'
      }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({
        error: 'Category is required',
        code: 'MISSING_CATEGORY'
      }, { status: 400 });
    }

    if (!validateCategory(category)) {
      return NextResponse.json({
        error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
        code: 'INVALID_CATEGORY'
      }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({
        error: 'Description is required',
        code: 'MISSING_DESCRIPTION'
      }, { status: 400 });
    }

    const trimmedDescription = description.trim();
    if (trimmedDescription.length === 0) {
      return NextResponse.json({
        error: 'Description cannot be empty',
        code: 'EMPTY_DESCRIPTION'
      }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({
        error: 'Date is required',
        code: 'MISSING_DATE'
      }, { status: 400 });
    }

    if (!validateDate(date)) {
      return NextResponse.json({
        error: 'Invalid date format. Must be a valid ISO timestamp',
        code: 'INVALID_DATE'
      }, { status: 400 });
    }

    const newTransaction = await db.insert(transactions)
      .values({
        type,
        amount,
        category,
        description: trimmedDescription,
        date,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newTransaction[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id)) || parseInt(id) <= 0) {
      return NextResponse.json({
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const { type, amount, category, description, date } = body;

    // Check if transaction exists
    const existing = await db.select()
      .from(transactions)
      .where(eq(transactions.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({
        error: 'Transaction not found'
      }, { status: 404 });
    }

    // Validate provided fields
    if (type !== undefined && !validateType(type)) {
      return NextResponse.json({
        error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
        code: 'INVALID_TYPE'
      }, { status: 400 });
    }

    if (amount !== undefined && !validateAmount(amount)) {
      return NextResponse.json({
        error: 'Amount must be a positive number',
        code: 'INVALID_AMOUNT'
      }, { status: 400 });
    }

    if (category !== undefined && !validateCategory(category)) {
      return NextResponse.json({
        error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
        code: 'INVALID_CATEGORY'
      }, { status: 400 });
    }

    if (description !== undefined) {
      const trimmedDescription = description.trim();
      if (trimmedDescription.length === 0) {
        return NextResponse.json({
          error: 'Description cannot be empty',
          code: 'EMPTY_DESCRIPTION'
        }, { status: 400 });
      }
    }

    if (date !== undefined && !validateDate(date)) {
      return NextResponse.json({
        error: 'Invalid date format. Must be a valid ISO timestamp',
        code: 'INVALID_DATE'
      }, { status: 400 });
    }

    // Build update object
    const updates: Record<string, any> = {};
    if (type !== undefined) updates.type = type;
    if (amount !== undefined) updates.amount = amount;
    if (category !== undefined) updates.category = category;
    if (description !== undefined) updates.description = description.trim();
    if (date !== undefined) updates.date = date;

    const updated = await db.update(transactions)
      .set(updates)
      .where(eq(transactions.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id)) || parseInt(id) <= 0) {
      return NextResponse.json({
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    // Check if transaction exists
    const existing = await db.select()
      .from(transactions)
      .where(eq(transactions.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({
        error: 'Transaction not found'
      }, { status: 404 });
    }

    const deleted = await db.delete(transactions)
      .where(eq(transactions.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Transaction deleted successfully',
      transaction: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}