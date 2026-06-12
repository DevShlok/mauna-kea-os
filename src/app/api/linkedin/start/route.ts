import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
    try {
        const { url } = await req.json();
        if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

        // Extract LinkedIn ID from URL
        const match = url.match(/linkedin\.com\/in\/([^/?]+)/i);
        if (!match) return NextResponse.json({ error: "Invalid LinkedIn URL format" }, { status: 400 });
        const id = match[1];

        const apiUrl = 'https://api.scrapingdog.com/profile';
        const params = {
          api_key: '6a2ba75cf8befae57133b7a2', // User's API key
          id: id,
          type: 'profile',
          premium: 'true',
          webhook: 'false',
          fresh: 'false'
        };

        const response = await axios.get(apiUrl, { params });
        
        if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
            return NextResponse.json({ success: true, data: response.data[0] });
        } else {
            return NextResponse.json({ error: "Profile not found or no data returned." }, { status: 500 });
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Scrapingdog API failed" }, { status: 500 });
    }
}
