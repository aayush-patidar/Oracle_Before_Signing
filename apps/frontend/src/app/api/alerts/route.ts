import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json([
        {
            _id: 'a1',
            event_type: 'MONITOR_MODE_VIOLATION',
            severity: 'HIGH',
            message: 'Transaction flagged by policies but allowed in Monitor Mode. Reasons: Unlimited allowance requested.',
            created_at: new Date().toISOString(),
            acknowledged: false
        }
    ]);
}

export async function PATCH() {
    return NextResponse.json({ success: true });
}
