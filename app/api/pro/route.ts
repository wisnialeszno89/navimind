import { getUserPlan } from "../../lib/userPlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const plan = await getUserPlan();
  return Response.json({ plan });
}