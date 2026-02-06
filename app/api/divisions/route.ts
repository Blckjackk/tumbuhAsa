import { NextResponse } from 'next/server';
import divisionsData from '@/data/divisions.json';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(divisionsData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load divisions data' }, { status: 500 });
  }
}
