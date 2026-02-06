import { NextResponse } from 'next/server';
import staffData from '@/data/staff.json';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(staffData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load staff data' }, { status: 500 });
  }
}
