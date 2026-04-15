import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function checkPdfLimit(userId: string) {
  const month = new Date().toISOString().slice(0, 7);

  const { data } = await supabase
    .from("usage")
    .select("*")
    .eq("user_id", userId)
    .eq("month", month)
    .single();

  if (!data) {
    await supabase.from("usage").insert({
      user_id: userId,
      month,
      pdf_edits: 0,
    });
    return { allowed: true, count: 0 };
  }

  if (data.pdf_edits >= 30) {
    return { allowed: false, count: data.pdf_edits };
  }

  return { allowed: true, count: data.pdf_edits };
}

export async function incrementPdfUsage(userId: string) {
  const month = new Date().toISOString().slice(0, 7);

  await supabase.rpc("increment_pdf_usage", {
    uid: userId,
    m: month,
  });
}