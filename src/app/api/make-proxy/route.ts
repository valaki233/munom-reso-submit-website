import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    // Accept JSON with base64 data
    const body = await req.json();
    
    // Convert base64 back to binary buffer
    const fileBuffer = Buffer.from(body.data_base64, 'base64');
    
    // Determine mime type
    const mimeType = body.fileName.toLowerCase().endsWith('.pdf') 
      ? 'application/pdf'
      : body.fileName.toLowerCase().endsWith('.docx')
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/msword';

    // Send file to Zapier webhook
    const zapierWebhookUrl = "https://hook.eu2.make.com/weadmgdt24ccwf818mjine2vwib8g8e6";
    const formData = new FormData();
    formData.append("file", new Blob([fileBuffer], { type: mimeType }), body.fileName);
    formData.append("title", body.title);
    formData.append("sponsor", body.sponsor);
    formData.append("cosponsors", body.cosponsors);
    formData.append("committeeCode", body.committeeCode);
    formData.append("type", body.type);

    const headers = new Headers();
    if (process.env.MAKE_API_KEY) {
      headers.append('x-make-apikey', '123456789');
    }

    const zapierResponse = await fetch(zapierWebhookUrl, {
        method: "POST",
        headers: headers,
        body: formData,
    });

    // Insert metadata into Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let supabaseError = null;
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { error } = await supabase
        .from('resolutions')
        .insert([
          { 
            title: body.title, 
            country: body.sponsor, 
            committee_code: body.committeeCode, 
            cosponsors: body.cosponsors 
          }
        ]);
      if (error) {
        supabaseError = error.message;
      }
    } else {
      supabaseError = "Supabase URL or anon key not provided in environment variables.";
    }

    // Return success with webhook status
    return NextResponse.json({
      ok: true,
      zapierWebhookStatus: zapierResponse.status,
      supabaseError: supabaseError
    });
  } catch (err: any) {
    console.error("make-proxy error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}