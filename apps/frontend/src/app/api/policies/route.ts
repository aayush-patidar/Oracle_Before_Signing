import { NextResponse } from 'next/server';

// In-Memory storage for the Vercel demo mode
const mockPolicies = [
    { id: '1', name: 'Standard Transaction Limit', description: 'Flag transactions over 5,000 USDT', mode: 'ENFORCE', type: 'LIMIT', enabled: true, created_at: new Date().toISOString() },
    { id: '2', name: 'Malicious Contract Guard', description: 'Block known drainer addresses', mode: 'ENFORCE', type: 'SECURITY', enabled: true, created_at: new Date().toISOString() },
    { id: '3', name: 'Approve Spender Analysis', description: 'Analyze intent of ERC20 approvals', mode: 'MONITOR', type: 'ALLOWANCE', enabled: true, created_at: new Date().toISOString() }
];

export async function GET() {
    return NextResponse.json(mockPolicies);
}

export async function POST(req: Request) {
    const body = await req.json();
    if (body.mode) {
        // Just a success response for the demo toggle
        return NextResponse.json({ success: true, mode: body.mode });
    }
    return NextResponse.json({ success: true, policy: body });
}
