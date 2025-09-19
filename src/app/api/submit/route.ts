import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

type ResolutionPayload = {
  type: 'resolution';
  title: string; sponsor: string; content: string;
  committeeCode?: string | null;
}

type AmendmentPayload = {
  type: 'amendment';
  resolutionNumber: string; content: string;
  committeeCode?: string | null;
}

type Payload = ResolutionPayload | AmendmentPayload;

export async function POST(req: NextRequest){
  let body: Payload;
  try{ body = await req.json(); }
  catch{ return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  // Basic validation mirroring required fields
  if(body.type === 'resolution'){
    if(!body.title || !body.sponsor || !body.content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  } else if(body.type === 'amendment'){
    if(!body.resolutionNumber || !body.content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  // Enforce committee code presence (login requirement)
  if(!('committeeCode' in body) || !body.committeeCode){
    return NextResponse.json({ error: 'Committee not set. Please login.' }, { status: 401 });
  }

  const record = {
    ...body,
    submittedAt: new Date().toISOString(),
    ip: req.headers.get('x-forwarded-for') || 'unknown'
  };

  // Supabase is required; do not silently fallback so we surface issues clearly
  try{
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if(!supabaseUrl || !supabaseServiceKey){
      return NextResponse.json({ error: 'Supabase not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.' }, { status: 500 });
    }

    const headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=representation'
    } as const;

    if(body.type === 'resolution'){
      const payload = {
        title: body.title,
        country: body.sponsor,
        content: body.content,
        committee_code: body.committeeCode || null
      };
      const resp = await fetch(`${supabaseUrl}/rest/v1/resolutions`, { method: 'POST', headers, body: JSON.stringify(payload) });
      if(!resp.ok){
        const t = await resp.text();
        console.error('Supabase insert error (resolutions):', t);
        return NextResponse.json({ error: 'Supabase insert failed', detail: t }, { status: resp.status || 500 });
      }
      const data = await resp.json().catch(()=>null);
      return NextResponse.json({ ok: true, data });
    } else {
      const payload = {
        resolution_number: body.resolutionNumber,
        content: body.content,
        committee_code: body.committeeCode || null
      };
      const resp = await fetch(`${supabaseUrl}/rest/v1/amendments`, { method: 'POST', headers, body: JSON.stringify(payload) });
      if(!resp.ok){
        const t = await resp.text();
        console.error('Supabase insert error (amendments):', t);
        return NextResponse.json({ error: 'Supabase insert failed', detail: t }, { status: resp.status || 500 });
      }
      const data = await resp.json().catch(()=>null);
      return NextResponse.json({ ok: true, data });
    }
  }catch(err){
    console.error('Supabase storage error', err);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
