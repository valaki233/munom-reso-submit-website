
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, committeeCode, resolutionNumber, content } = body;

    if (type !== 'amendment') {
      return NextResponse.json({ error: "This endpoint is for amendments only." }, { status: 400 });
    }

    if (!resolutionNumber || !content || !committeeCode) {
      return NextResponse.json({ error: "Missing required fields for amendment." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase URL or service key not provided in environment variables.");
      return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('amendments')
      .insert([
        {
          committee_code: committeeCode,
          resolution_number: resolutionNumber,
          content: content,
        }
      ]);

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Amendment submitted successfully." });

  } catch (err: any) {
    console.error("submit-amendment error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
