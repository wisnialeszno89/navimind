import { getUserId } from "../../../lib/userId";
import { getProMemory } from "../../../lib/proMemory";

export async function GET() {
  const userId = getUserId();

  if (!userId) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const memory = await getProMemory(userId);

  return Response.json({
    emotionalLevels: memory?.emotionalLevels ?? [],
  });
}
