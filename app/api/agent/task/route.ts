import { NextResponse } from "next/server";
import {
  reasonAgentTask,
} from "@/lib/agent/reasonAgentTask";
import type {
  AgentTaskContract,
  AgentTaskWorldElement,
} from "@/lib/agent/agentTaskContract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 256 * 1024;
const MAX_GOAL_LENGTH = 8_000;
const MAX_TASK_ID_LENGTH = 256;
const MAX_WORLD_ELEMENTS = 500;
const MAX_TEXT_LENGTH = 20_000;
const MAX_EXPERIENCE_ITEMS = 20;

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function isJsonContentType(req: Request): boolean {
  return (req.headers.get("content-type") || "")
    .toLowerCase()
    .split(";")[0]
    .trim() === "application/json";
}

async function readBoundedBody(req: Request): Promise<unknown | null> {
  const contentLength = req.headers.get("content-length");
  if (contentLength !== null) {
    const parsedLength = Number(contentLength);
    if (!Number.isFinite(parsedLength) || parsedLength < 0) {
      throw new Error("INVALID_CONTENT_LENGTH");
    }
    if (parsedLength > MAX_BODY_BYTES) {
      throw new RangeError("BODY_TOO_LARGE");
    }
  }

  const raw = await req.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    throw new RangeError("BODY_TOO_LARGE");
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function validOptionalText(value: unknown, maxLength = MAX_TEXT_LENGTH): boolean {
  return value === undefined ||
    value === null ||
    (typeof value === "string" && value.length <= maxLength);
}

function isWorldElement(value: unknown): value is AgentTaskWorldElement {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.kind === "string" &&
    item.kind.length > 0 &&
    item.kind.length <= 128 &&
    (item.label === null ||
      (typeof item.label === "string" && item.label.length <= MAX_TEXT_LENGTH)) &&
    typeof item.interaction_capability === "string" &&
    item.interaction_capability.length <= 128 &&
    validOptionalText(item.current_value) &&
    (item.confidence === undefined ||
      (typeof item.confidence === "number" &&
        Number.isFinite(item.confidence) &&
        item.confidence >= 0 &&
        item.confidence <= 1))
  );
}

function isBoundedAgentTask(value: unknown): value is AgentTaskContract {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const body = value as Record<string, unknown>;
  if (
    body.version !== "1" ||
    typeof body.goal !== "string" ||
    body.goal.trim().length === 0 ||
    body.goal.length > MAX_GOAL_LENGTH ||
    typeof body.task_id !== "string" ||
    body.task_id.trim().length === 0 ||
    body.task_id.length > MAX_TASK_ID_LENGTH ||
    typeof body.intent !== "string" ||
    body.intent.length > 256 ||
    !body.world ||
    typeof body.world !== "object" ||
    Array.isArray(body.world) ||
    !body.constraints ||
    typeof body.constraints !== "object" ||
    Array.isArray(body.constraints)
  ) {
    return false;
  }

  const world = body.world as Record<string, unknown>;
  if (
    !validOptionalText(world.active_application, 512) ||
    !validOptionalText(world.active_window_title, 2_000) ||
    !Array.isArray(world.visible_elements) ||
    world.visible_elements.length > MAX_WORLD_ELEMENTS ||
    !world.visible_elements.every(isWorldElement) ||
    typeof world.element_count !== "number" ||
    !Number.isInteger(world.element_count) ||
    world.element_count < 0 ||
    world.element_count > 100_000 ||
    world.element_count < world.visible_elements.length
  ) {
    return false;
  }

  if (
    body.experience !== undefined &&
    (!Array.isArray(body.experience) ||
      body.experience.length > MAX_EXPERIENCE_ITEMS)
  ) {
    return false;
  }

  const constraints = body.constraints as Record<string, unknown>;
  if (
    typeof constraints.semantic_only !== "boolean" ||
    typeof constraints.verify_each_action !== "boolean" ||
    typeof constraints.max_actions !== "number" ||
    !Number.isInteger(constraints.max_actions) ||
    constraints.max_actions < 1 ||
    constraints.max_actions > 100
  ) {
    return false;
  }

  if (
    body.metadata !== undefined &&
    (!body.metadata || typeof body.metadata !== "object" || Array.isArray(body.metadata))
  ) {
    return false;
  }

  return true;
}

export async function POST(req: Request) {
  try {
    const configuredSecret = process.env.NAVIMIND_AGENT_SECRET?.trim();
    const allowDevBypass =
      process.env.NODE_ENV !== "production" &&
      process.env.NAVIMIND_AGENT_ALLOW_DEV_BYPASS === "1";

    if (!configuredSecret) {
      if (!allowDevBypass) {
        return jsonError("AGENT_AUTH_NOT_CONFIGURED", 503);
      }
    } else {
      const providedSecret = req.headers.get("x-navimind-agent-secret") || "";
      if (!providedSecret || providedSecret.trim() !== configuredSecret) {
        return jsonError("UNAUTHORIZED", 401);
      }
    }

    if (!isJsonContentType(req)) {
      return jsonError("UNSUPPORTED_CONTENT_TYPE", 415);
    }

    let body: unknown;
    try {
      body = await readBoundedBody(req);
    } catch (error) {
      if (error instanceof RangeError && error.message === "BODY_TOO_LARGE") {
        return jsonError("PAYLOAD_TOO_LARGE", 413);
      }
      if (error instanceof Error && error.message === "INVALID_CONTENT_LENGTH") {
        return jsonError("INVALID_CONTENT_LENGTH", 400);
      }
      throw error;
    }

    if (!isBoundedAgentTask(body)) {
      return jsonError("INVALID_AGENT_TASK", 400);
    }

    const result = await reasonAgentTask(body);
    return NextResponse.json(result);
  } catch {
    // Never log request bodies, auth headers, API keys or provider details.
    console.error("NAVIMIND_AGENT_TASK_ERROR");
    return jsonError("AGENT_TASK_FAILED", 500);
  }
}
