type Plan = "free" | "pro" | "pro_plus";

type Feature =
  | "image"
  | "pdf_read"
  | "pdf_edit"
  | "mask";

const rules: Record<Plan, Feature[]> = {
  free: [],
  pro: ["image", "pdf_read"],
  pro_plus: ["image", "pdf_read", "pdf_edit", "mask"],
};

export function canUse(plan: Plan, feature: Feature) {
  return rules[plan]?.includes(feature);
}