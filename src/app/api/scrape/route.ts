import { NextResponse } from 'next/server';
import { scrapeAll } from '@/lib/scraper-new';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
        return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    try {
        const results = await scrapeAll(q);
        return NextResponse.json(results);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to scrape data' }, { status: 500 });
    }
}
