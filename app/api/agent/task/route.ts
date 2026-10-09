import { NextResponse } from "next/server";
import {
  reasonAgentTask,
} from "@/lib/agent/reasonAgentTask";
import type {
  AgentTaskContract,
} from "@/lib/agent/agentTaskContract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 256 * 1024;
const MAX_GOAL_LENGTH = 8_000;
const MAX_TASK_ID_LENGTH = 256;
const MAX_WORLD_ELEMENTS = 500;
const MAX_WORLD_TEXT_LENGTH = 20_000;

function unauthorized() {
  return NextResponse.json(
    { error: "UNAUTHORIZED" },
    { status: 401 }
  );
}

function isJsonContentType(req: Request): boolean {
  return (req.headers.get("content-type") || "")
    .toLowerCase()
    .split(";")[0]
    .trim() === "application/json";
}

async function readBoundedBody(req: Request): Promise<unknown | null> {
  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const parsedLength = Number(contentLength);
    if (!Number.isFinite(parsedLength) || parsedLength < 0 || parsedLength > MAX_BODY_BYTES) {
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

function isBoundedAgentTask(value: unknown): value is AgentTaskContract {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const body = value as Record<string, unknown>;
  if (
    typeof body.goal !== "string" ||
    body.goal.trim().length === 0 ||
    body.goal.length > MAX_GOAL_LENGTH ||
    typeof body.task_id !== "string" ||
    body.task_id.trim().length === 0 ||
    body.task_id.length > MAX_TASK_ID_LENGTH ||
    !body.world ||
    typeof body.world !== "object" ||
    Array.isArray(body.world)
  ) {
    return false;
  }

  if (body.version !== "1") {
    return false;
  }

  const world = body.world as Record<string, unknown>;
  const elements = world.elements;
  if (elements !== undefined) {
    if (!Array.isArray(elements) || elements.length > MAX_WORLD_ELEMENTS) {
      return false;
    }
    for (const element of elements) {
      if (!element || typeof element !== "object" || Array.isArray(element)) {
        return false;
      }
      const item = element as Record<string, unknown>;
      for (const key of ["label", "name", "text", "value", "description"]) {
        const field = item[key];
        if (field !== undefined && typeof field === "string" && field.length > MAX_WORLD_TEXT_LENGTH) {
          return false;
        }
      }
    }
  }

  return true;
}

export async function POST(req: Request) {
  try {
    // Deployed endpoints must never become unauthenticated because a secret
    // was omitted from configuration. Local development requires an explicit
    // opt-in to bypass authentication.
    const configuredSecret = process.env.NAVIMIND_AGENT_SECRET?.trim();
    const allowDevBypass =
      process.env.NODE_ENV !== "production" &&
      process.env.NAVIMIND_AGENT_ALLOW_DEV_BYPASS === "1";

    if (!configuredSecret) {
      if (!allowDevBypass) {
        return NextResponse.json(
          { error: "AGENT_AUTH_NOT_CONFIGURED" },
          { status: 503 }
        );
      }
    } else {
      const providedSecret =
        req.headers.get("x-navimind-agent-secret")?.trim() || "";
      if (!providedSecret || providedSecret !== configuredSecret) {
        return unauthorized();
      }
    }

    if (!isJsonContentType(req)) {
      return NextResponse.json(
        { error: "UNSUPPORTED_CONTENT_TYPE" },
        { status: 415 }
      );
    }

    let body: unknown;
    try {
      body = await readBoundedBody(req);
    } catch (error) {
      if (error instanceof RangeError && error.message === "BODY_TOO_LARGE") {
        return NextResponse.json(
          { error: "PAYLOAD_TOO_LARGE" },
          { status: 413 }
        );
      }
      throw error;
    }

    if (!isBoundedAgentTask(body)) {
      return NextResponse.json(
        { error: "INVALID_AGENT_TASK" },
        { status: 400 }
      );
    }

    const result = await reasonAgentTask(body);
    return NextResponse.json(result);
  } catch {
    // Avoid logging request bodies, authorization headers, user documents,
    // or provider errors that might contain sensitive payload fragments.
    console.error("NAVIMIND_AGENT_TASK_ERROR");
    return NextResponse.json(
      { error: "AGENT_TASK_FAILED" },
      { status: 500 }
    );
  }
}
