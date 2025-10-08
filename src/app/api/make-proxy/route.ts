import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Accept JSON with base64 data
    const body = await req.json();
    
    // Convert base64 back to binary buffer
    const fileBuffer = Buffer.from(body.data_base64, 'base64');

    if (fileBuffer.length === 0) {
      return NextResponse.json({ error: 'File content is empty after base64 decoding.' }, { status: 400 });
    }
    
    // Determine mime type
    const mimeType = body.fileName.toLowerCase().endsWith('.pdf') 
      ? 'application/pdf'
      : body.fileName.toLowerCase().endsWith('.docx')
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/msword';

    // Manually construct the multipart/form-data body
    const boundary = `----WebKitFormBoundary${Math.random().toString(16).slice(2)}`;
    const parts: Buffer[] = [];

    const textFields = { title: body.title, sponsor: body.sponsor, cosponsors: body.cosponsors, committeeCode: body.committeeCode, type: body.type };

    for (const [key, value] of Object.entries(textFields)) {
        parts.push(Buffer.from(`--${boundary}\r\n`));
        parts.push(Buffer.from(`Content-Disposition: form-data; name="${key}"\r\n\r\n`));
        parts.push(Buffer.from((value as string) + '\r\n'));
    }

    parts.push(Buffer.from(`--${boundary}\r\n`));
    parts.push(Buffer.from(`Content-Disposition: form-data; name="file"; filename="${body.fileName}"\r\n`));
    parts.push(Buffer.from(`Content-Type: ${mimeType}\r\n\r\n`));
    parts.push(fileBuffer);
    parts.push(Buffer.from('\r\n'));

    parts.push(Buffer.from(`--${boundary}--\r\n`));

    const requestBody = Buffer.concat(parts);

    // Send file to make.com webhook
    const zapierWebhookUrl = "https://hook.eu2.make.com/weadmgdt24ccwf818mjine2vwib8g8e6";
    const headers = new Headers();
    headers.append('Content-Type', `multipart/form-data; boundary=${boundary}`);
    if (process.env.MAKE_API_KEY) {
      headers.append('x-make-apikey', '123456789');
    }

    const zapierResponse = await fetch(zapierWebhookUrl, {
        method: "POST",
        headers: headers,
        body: requestBody,
    });

    if (!zapierResponse.ok) {
      const errorText = await zapierResponse.text();
      console.error("make.com webhook error:", errorText);
      return NextResponse.json({ error: `Submission failed: ${errorText}` }, { status: zapierResponse.status });
    }

    // Return success with webhook status
    return NextResponse.json({
      ok: true,
      zapierWebhookStatus: zapierResponse.status
    });
  } catch (err: any) {
    console.error("make-proxy error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}