import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY が設定されていません" },
      { status: 500 }
    );
  }

  let incoming: FormData;
  try {
    incoming = await request.formData();
  } catch {
    return NextResponse.json({ error: "音声データが読めませんでした" }, { status: 400 });
  }

  const audio = incoming.get("audio");
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "音声データがありません" }, { status: 400 });
  }

  const filename = (audio as File).name || "audio.mp4";

  const upstream = new FormData();
  upstream.append("file", audio, filename);
  upstream.append("model", "whisper-1");
  upstream.append("language", "ja");
  upstream.append("response_format", "json");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: upstream,
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `Whisper API エラー: ${res.status} ${text.slice(0, 200)}` },
      { status: res.status }
    );
  }

  const data = (await res.json()) as { text?: string };
  return NextResponse.json({ transcript: (data.text ?? "").trim() });
}
