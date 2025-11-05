import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userPreferences } from '@/db/schema';
import { eq } from 'drizzle-orm';

const VALID_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'NGN',
  'CHF', 'NZD', 'SGD', 'HKD', 'SEK', 'NOK', 'DKK', 'MXN',
  'BRL', 'ZAR', 'RUB', 'KRW'
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId || userId.trim() === '') {
      return NextResponse.json(
        { 
          error: 'userId is required',
          code: 'MISSING_USER_ID'
        },
        { status: 400 }
      );
    }

    const preferences = await db.select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId.trim()))
      .limit(1);

    if (preferences.length === 0) {
      return NextResponse.json(
        { 
          error: 'User preferences not found',
          code: 'PREFERENCES_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(preferences[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, currency } = body;

    console.log('POST /api/user-preferences - Received body:', { userId, currency });

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.error('Invalid userId:', userId);
      return NextResponse.json(
        { 
          error: 'userId is required and must be a non-empty string',
          code: 'INVALID_USER_ID'
        },
        { status: 400 }
      );
    }

    const sanitizedUserId = userId.trim();
    let sanitizedCurrency = currency ? currency.trim().toUpperCase() : 'USD';

    console.log('Sanitized values:', { sanitizedUserId, sanitizedCurrency });

    if (currency && !VALID_CURRENCIES.includes(sanitizedCurrency)) {
      console.error('Invalid currency:', sanitizedCurrency, 'Valid currencies:', VALID_CURRENCIES);
      return NextResponse.json(
        { 
          error: 'Invalid currency code. Must be a valid 3-letter currency code',
          code: 'INVALID_CURRENCY',
          receivedCurrency: sanitizedCurrency,
          validCurrencies: VALID_CURRENCIES
        },
        { status: 400 }
      );
    }

    const existingPreferences = await db.select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, sanitizedUserId))
      .limit(1);

    const timestamp = new Date().toISOString();

    if (existingPreferences.length > 0) {
      console.log('Updating existing preferences for user:', sanitizedUserId);
      const updated = await db.update(userPreferences)
        .set({
          currency: sanitizedCurrency,
          updatedAt: timestamp
        })
        .where(eq(userPreferences.userId, sanitizedUserId))
        .returning();

      console.log('Successfully updated preferences:', updated[0]);
      return NextResponse.json(updated[0], { status: 200 });
    } else {
      console.log('Creating new preferences for user:', sanitizedUserId);
      const created = await db.insert(userPreferences)
        .values({
          userId: sanitizedUserId,
          currency: sanitizedCurrency,
          createdAt: timestamp,
          updatedAt: timestamp
        })
        .returning();

      console.log('Successfully created preferences:', created[0]);
      return NextResponse.json(created[0], { status: 201 });
    }
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}