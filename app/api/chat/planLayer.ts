import { UserPlan, getProLayer, getProPlusLayer } from "../../lib/plans";

export function buildPlanLayer(plan: UserPlan): string {
  if (plan === "pro") return getProLayer();
  if (plan === "pro_plus") return getProPlusLayer();
  return "";
}
