import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reminders } from '@/db/schema';
import { eq, like, or, asc, and } from 'drizzle-orm';

const VALID_CATEGORIES = ['food', 'transport', 'academic', 'entertainment', 'shopping', 'utilities', 'health', 'housing', 'other'];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single reminder by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const reminder = await db.select()
        .from(reminders)
        .where(eq(reminders.id, parseInt(id)))
        .limit(1);

      if (reminder.length === 0) {
        return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
      }

      return NextResponse.json(reminder[0], { status: 200 });
    }

    // List reminders with filters and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const isCompletedParam = searchParams.get('isCompleted');
    const category = searchParams.get('category');

    let query = db.select().from(reminders);
    const conditions = [];

    // Search filter
    if (search) {
      conditions.push(
        or(
          like(reminders.title, `%${search}%`),
          like(reminders.description, `%${search}%`)
        )
      );
    }

    // Completion status filter
    if (isCompletedParam !== null) {
      const isCompleted = isCompletedParam === 'true';
      conditions.push(eq(reminders.isCompleted, isCompleted));
    }

    // Category filter
    if (category) {
      if (!VALID_CATEGORIES.includes(category)) {
        return NextResponse.json({ 
          error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
          code: "INVALID_CATEGORY" 
        }, { status: 400 });
      }
      conditions.push(eq(reminders.category, category));
    }

    // Apply filters
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    // Order by dueDate ascending and apply pagination
    const results = await query
      .orderBy(asc(reminders.dueDate))
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
    const { title, description, dueDate, isCompleted, category } = body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ 
        error: "Title is required and cannot be empty",
        code: "MISSING_TITLE" 
      }, { status: 400 });
    }

    if (!dueDate || typeof dueDate !== 'string') {
      return NextResponse.json({ 
        error: "Due date is required",
        code: "MISSING_DUE_DATE" 
      }, { status: 400 });
    }

    // Validate dueDate is a valid ISO timestamp
    const dueDateObj = new Date(dueDate);
    if (isNaN(dueDateObj.getTime())) {
      return NextResponse.json({ 
        error: "Due date must be a valid ISO timestamp",
        code: "INVALID_DUE_DATE" 
      }, { status: 400 });
    }

    // Validate category if provided
    if (category && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ 
        error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
        code: "INVALID_CATEGORY" 
      }, { status: 400 });
    }

    // Validate isCompleted if provided
    if (isCompleted !== undefined && typeof isCompleted !== 'boolean') {
      return NextResponse.json({ 
        error: "isCompleted must be a boolean value",
        code: "INVALID_IS_COMPLETED" 
      }, { status: 400 });
    }

    // Prepare insert data
    const newReminder = await db.insert(reminders)
      .values({
        title: title.trim(),
        description: description ? description.trim() : null,
        dueDate: dueDate,
        isCompleted: isCompleted ?? false,
        category: category || null
      })
      .returning();

    return NextResponse.json(newReminder[0], { status: 201 });
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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if reminder exists
    const existing = await db.select()
      .from(reminders)
      .where(eq(reminders.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, dueDate, isCompleted, category } = body;
    const updates: any = {};

    // Validate and prepare title
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return NextResponse.json({ 
          error: "Title cannot be empty",
          code: "INVALID_TITLE" 
        }, { status: 400 });
      }
      updates.title = title.trim();
    }

    // Validate and prepare description
    if (description !== undefined) {
      updates.description = description ? description.trim() : null;
    }

    // Validate and prepare dueDate
    if (dueDate !== undefined) {
      if (typeof dueDate !== 'string') {
        return NextResponse.json({ 
          error: "Due date must be a string",
          code: "INVALID_DUE_DATE" 
        }, { status: 400 });
      }
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        return NextResponse.json({ 
          error: "Due date must be a valid ISO timestamp",
          code: "INVALID_DUE_DATE" 
        }, { status: 400 });
      }
      updates.dueDate = dueDate;
    }

    // Validate and prepare isCompleted
    if (isCompleted !== undefined) {
      if (typeof isCompleted !== 'boolean') {
        return NextResponse.json({ 
          error: "isCompleted must be a boolean value",
          code: "INVALID_IS_COMPLETED" 
        }, { status: 400 });
      }
      updates.isCompleted = isCompleted;
    }

    // Validate and prepare category
    if (category !== undefined) {
      if (category !== null && !VALID_CATEGORIES.includes(category)) {
        return NextResponse.json({ 
          error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
          code: "INVALID_CATEGORY" 
        }, { status: 400 });
      }
      updates.category = category;
    }

    // Perform update
    const updated = await db.update(reminders)
      .set(updates)
      .where(eq(reminders.id, parseInt(id)))
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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if reminder exists
    const existing = await db.select()
      .from(reminders)
      .where(eq(reminders.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    // Delete the reminder
    const deleted = await db.delete(reminders)
      .where(eq(reminders.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Reminder deleted successfully',
      reminder: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}