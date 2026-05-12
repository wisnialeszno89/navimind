import { kv } from "@vercel/kv";
import { getSessionEmail } from "./auth/session";

export type Plan = "free" | "pro" | "pro_plus";

type PlanState = {
  plan: Plan;
  updatedAt: number;
  subscriptionId?: string;
  customerId?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getPlanByEmail(email: string): Promise<Plan> {
  const key = `plan:${normalizeEmail(email)}`;
  const state = await kv.get<PlanState>(key);
  return state?.plan ?? "free";
}

export async function setPlanByEmail(
  email: string,
  plan: Plan,
  subscriptionId?: string,
  customerId?: string
) {
  const key = `plan:${normalizeEmail(email)}`;
  const state: PlanState = {
  plan,
  updatedAt: Date.now(),
  subscriptionId,
  customerId,
};
  await kv.set(key, state);
}

// ✅ legacy: aktualny user plan (po sesji)
export async function getUserPlan(): Promise<Plan> {
  const email = getSessionEmail();

  console.log("SESSION EMAIL:", email);

  if (!email) return "free";

  const plan = await getPlanByEmail(email);

  console.log("PLAN FROM KV:", plan);

  return plan;
}

export async function setUserPlan(plan: Plan): Promise<void> {
  const email = getSessionEmail();
  if (!email) return;
  await setPlanByEmail(email, plan);
}
export async function getUserBilling() {
  const email = getSessionEmail();

  if (!email) return null;

  const key = `plan:${normalizeEmail(email)}`;

  return kv.get<PlanState>(key);
}