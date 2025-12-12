import { NextResponse } from "next/server";


export async function POST(req: Request) {
try {
const fd = await req.formData();
const file = fd.get("file") as File | null;
if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });


// Simple extraction: read as text if possible
const buffer = await file.arrayBuffer();
const text = new TextDecoder().decode(buffer);


// In real app: use pdf parsing library server-side (pdf-parse) or external service
return NextResponse.json({ text: text.slice(0, 20000) });
} catch (err:any) {
console.error(err);
return NextResponse.json({ error: "pdf error" }, { status: 500 });
}
}