import { NextResponse } from 'next/server';
import messagesData from '@/data/messages.json';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(messagesData);
  } catch (error) {
    console.error('Failed to load messages data:', error);
    return NextResponse.json({ error: 'Failed to load messages data' }, { status: 500 });
  }
}
