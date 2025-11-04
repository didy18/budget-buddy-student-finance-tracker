import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { savingsGoals } from '@/db/schema';
import { eq, like, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single savings goal by ID
    if (id) {
      if (!id || isNaN(parseInt(id)) || parseInt(id) <= 0) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const savingsGoal = await db
        .select()
        .from(savingsGoals)
        .where(eq(savingsGoals.id, parseInt(id)))
        .limit(1);

      if (savingsGoal.length === 0) {
        return NextResponse.json(
          { error: 'Savings goal not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(savingsGoal[0], { status: 200 });
    }

    // List all savings goals with pagination and search
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');

    let query = db.select().from(savingsGoals);

    if (search) {
      query = query.where(
        or(
          like(savingsGoals.name, `%${search}%`),
          like(savingsGoals.description, `%${search}%`)
        )
      );
    }

    const results = await query
      .orderBy(desc(savingsGoals.createdAt))
      .limit(limit)
      .offset(offset);

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
    const { name, targetAmount, currentAmount, deadline, description } = body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and cannot be empty', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (targetAmount === undefined || targetAmount === null) {
      return NextResponse.json(
        { error: 'Target amount is required', code: 'MISSING_TARGET_AMOUNT' },
        { status: 400 }
      );
    }

    // Validate targetAmount is a positive number
    if (typeof targetAmount !== 'number' || targetAmount <= 0) {
      return NextResponse.json(
        {
          error: 'Target amount must be a positive number',
          code: 'INVALID_TARGET_AMOUNT',
        },
        { status: 400 }
      );
    }

    // Validate currentAmount if provided
    const validatedCurrentAmount = currentAmount ?? 0;
    if (
      typeof validatedCurrentAmount !== 'number' ||
      validatedCurrentAmount < 0
    ) {
      return NextResponse.json(
        {
          error: 'Current amount must be a non-negative number',
          code: 'INVALID_CURRENT_AMOUNT',
        },
        { status: 400 }
      );
    }

    // Validate deadline if provided
    if (deadline) {
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        return NextResponse.json(
          {
            error: 'Deadline must be a valid ISO timestamp string',
            code: 'INVALID_DEADLINE',
          },
          { status: 400 }
        );
      }
    }

    // Create new savings goal
    const newSavingsGoal = await db
      .insert(savingsGoals)
      .values({
        name: name.trim(),
        targetAmount,
        currentAmount: validatedCurrentAmount,
        deadline: deadline || null,
        description: description?.trim() || null,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newSavingsGoal[0], { status: 201 });
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

    // Validate ID
    if (!id || isNaN(parseInt(id)) || parseInt(id) <= 0) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if savings goal exists
    const existingSavingsGoal = await db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.id, parseInt(id)))
      .limit(1);

    if (existingSavingsGoal.length === 0) {
      return NextResponse.json(
        { error: 'Savings goal not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, targetAmount, currentAmount, deadline, description } = body;

    // Build update object
    const updates: any = {};

    // Validate and add name if provided
    if (name !== undefined) {
      if (name.trim() === '') {
        return NextResponse.json(
          {
            error: 'Name cannot be empty',
            code: 'INVALID_NAME',
          },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    // Validate and add targetAmount if provided
    if (targetAmount !== undefined) {
      if (typeof targetAmount !== 'number' || targetAmount <= 0) {
        return NextResponse.json(
          {
            error: 'Target amount must be a positive number',
            code: 'INVALID_TARGET_AMOUNT',
          },
          { status: 400 }
        );
      }
      updates.targetAmount = targetAmount;
    }

    // Validate and add currentAmount if provided
    if (currentAmount !== undefined) {
      if (typeof currentAmount !== 'number' || currentAmount < 0) {
        return NextResponse.json(
          {
            error: 'Current amount must be a non-negative number',
            code: 'INVALID_CURRENT_AMOUNT',
          },
          { status: 400 }
        );
      }
      updates.currentAmount = currentAmount;
    }

    // Validate and add deadline if provided
    if (deadline !== undefined) {
      if (deadline === null) {
        updates.deadline = null;
      } else {
        const deadlineDate = new Date(deadline);
        if (isNaN(deadlineDate.getTime())) {
          return NextResponse.json(
            {
              error: 'Deadline must be a valid ISO timestamp string',
              code: 'INVALID_DEADLINE',
            },
            { status: 400 }
          );
        }
        updates.deadline = deadline;
      }
    }

    // Add description if provided
    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }

    // Update savings goal
    const updatedSavingsGoal = await db
      .update(savingsGoals)
      .set(updates)
      .where(eq(savingsGoals.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedSavingsGoal[0], { status: 200 });
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

    // Validate ID
    if (!id || isNaN(parseInt(id)) || parseInt(id) <= 0) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if savings goal exists
    const existingSavingsGoal = await db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.id, parseInt(id)))
      .limit(1);

    if (existingSavingsGoal.length === 0) {
      return NextResponse.json(
        { error: 'Savings goal not found' },
        { status: 404 }
      );
    }

    // Delete savings goal
    const deleted = await db
      .delete(savingsGoals)
      .where(eq(savingsGoals.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Savings goal deleted successfully',
        deletedSavingsGoal: deleted[0],
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