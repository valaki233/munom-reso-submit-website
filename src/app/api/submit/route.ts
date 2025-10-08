import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

type ResolutionPayload = {
  type: 'resolution';
  title: string; sponsor: string; cosponsors?: string; content: string;
  committeeCode?: string | null;
}

type AmendmentPayload = {
  type: 'amendment';
  resolutionNumber: string; content: string;
  committeeCode?: string | null;
}

type Payload = ResolutionPayload | AmendmentPayload;

export async function POST(req: NextRequest){
  const contentType = req.headers.get('content-type') || '';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if(!supabaseUrl || !supabaseServiceKey){
    return NextResponse.json({ error: 'Supabase not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.' }, { status: 500 });
  }
  const headers = {
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`,
  } as const;


  if (contentType.includes('multipart/form-data')) {
    // Resolution submission with file upload
    const formData = await req.formData();
    const type = formData.get('type') as string;
    const committeeCode = formData.get('committeeCode') as string;
    const title = formData.get('title') as string;
    const sponsor = formData.get('sponsor') as string;
    const cosponsors = formData.get('cosponsors') as string;
    const file = formData.get('content') as File;

    if (type !== 'resolution' || !title || !sponsor || !file) {
      return NextResponse.json({ error: 'Missing fields for resolution' }, { status: 400 });
    }

    if (!committeeCode) {
      return NextResponse.json({ error: 'Committee not set. Please login.' }, { status: 401 });
    }

    try {
      // Convert file to base64
      const fileBuffer = await file.arrayBuffer();
      const data_base64 = Buffer.from(fileBuffer).toString('base64');

      // Send to make-proxy
      const proxyResponse = await fetch(new URL('/api/make-proxy', req.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data_base64,
          fileName: file.name,
          title,
          sponsor,
          cosponsors,
          committeeCode,
          type,
        }),
      });

      if (!proxyResponse.ok) {
        const errorText = await proxyResponse.text();
        console.error('make-proxy error:', errorText);
        return NextResponse.json({ error: 'Failed to submit to make-proxy', detail: errorText }, { status: proxyResponse.status || 500 });
      }

      // Now, insert metadata into the 'resolutions' table in Supabase
      const payload = {
        title: title,
        country: sponsor,
        cosponsors: cosponsors,
        committee_code: committeeCode || null
        // The 'content' field (the file itself) is not sent to Supabase anymore
      };

      const dbResponse = await fetch(`${supabaseUrl}/rest/v1/resolutions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (!dbResponse.ok) {
        const t = await dbResponse.text();
        console.error('Supabase insert error (resolutions):', t);
        // TODO: Should we try to undo the make.com submission?
        return NextResponse.json({ error: 'Supabase insert failed', detail: t }, { status: dbResponse.status || 500 });
      }

      const data = await dbResponse.json().catch(() => null);
      return NextResponse.json({ ok: true, data });

    } catch (err) {
      console.error('Resolution submission error', err);
      return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
    }

  } else {
    // Existing logic for amendments
    let body: Payload;
    try{ body = await req.json(); }
    catch{ return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

    if (body.type === 'amendment') {
      if(!body.resolutionNumber || !body.content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    if(!('committeeCode' in body) || !body.committeeCode){
      return NextResponse.json({ error: 'Committee not set. Please login.' }, { status: 401 });
    }

    try{
      const payload = {
        resolution_number: body.resolutionNumber,
        content: body.content,
        committee_code: body.committeeCode || null
      };
      const resp = await fetch(`${supabaseUrl}/rest/v1/amendments`, { method: 'POST', headers: {...headers, 'Content-Type': 'application/json', 'Prefer': 'return=representation'}, body: JSON.stringify(payload) });
      if(!resp.ok){
        const t = await resp.text();
        console.error('Supabase insert error (amendments):', t);
        return NextResponse.json({ error: 'Supabase insert failed', detail: t }, { status: resp.status || 500 });
      }
      const data = await resp.json().catch(()=>null);
      return NextResponse.json({ ok: true, data });
    }catch(err){
      console.error('Amendment submission error', err);
      return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
    }
  }
}