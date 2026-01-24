import { NextResponse } from 'next/server';

export async function POST() {
    // Return a static mock run ID for the standalone demo
    const runId = 'demo-' + Math.random().toString(36).substring(7);
    return NextResponse.json({ runId });
}

export async function GET(req: Request) {
    const url = new URL(req.url);
    const stream = url.searchParams.get('stream');

    if (stream) {
        // For standalone demo, return a pre-baked successful run stream
        const encoder = new TextEncoder();
        const customStream = new ReadableStream({
            start(controller) {
                const events = [
                    { stage: 'intent_parse', message: 'Parsing intent...' },
                    { stage: 'fork_chain', message: 'Forking chain...' },
                    { stage: 'simulate', message: 'Simulating...' },
                    { stage: 'extract_delta', message: 'Extracting reality delta...' },
                    { stage: 'judge', message: 'Judging...' },
                    {
                        stage: 'final',
                        judgment: {
                            judgment: 'DENY',
                            reasoning_summary: 'This transaction grants unlimited spending power to a non-verified contract.',
                            reasoning_bullets: ['Unlimited allowance requested', 'Contract is not on the whitelist'],
                            override_allowed: true,
                            risk_score: 85
                        }
                    }
                ];

                events.forEach((event, i) => {
                    setTimeout(() => {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
                        if (i === events.length - 1) controller.close();
                    }, i * 1000);
                });
            }
        });

        return new Response(customStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}
