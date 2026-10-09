import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  reasonAgentTask,
} from "@/lib/agent/reasonAgentTask";
import type {
  AgentTaskContract,
  AgentTaskReasoningResponse,
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
const MAX_ALLOWED_ACTIONS = 100;
const MAX_ALLOWED_ACTION_NAME_LENGTH = 128;
const MAX_ACTION_DESCRIPTION_LENGTH = 2_000;
const MAX_ACTION_TARGET_LENGTH = 2_000;
const MAX_ACTION_VALUE_LENGTH = 8_000;

// This server-side policy is intentionally aligned with
// wh-ai-parser/app/agent/reasoning/reasoning_action_policy.py.
// The local runtime still independently enforces its own allowlist before
// any physical computer action.
const SERVER_ALLOWED_ACTIONS = new Set([
  "analyze_request",
  "collect_offer_context",
  "validate_offer",
  "build_construction",
  "prepare_quote",
  "click_screen_element",
  "click",
  "click_ui_element",
  "write_text",
  "type_text",
  "open_new_offer",
  "browser_navigate",
  "browser_read",
  "browser_click",
  "browser_write_text",
  "browser_select_option",
  "browser_back",
]);

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function timingSafeSecretMatch(provided: string, configured: string): boolean {
  const providedBytes = Buffer.from(provided, "utf8");
  const configuredBytes = Buffer.from(configured, "utf8");
  if (providedBytes.length === 0 || providedBytes.length !== configuredBytes.length) {
    return false;
  }
  return timingSafeEqual(providedBytes, configuredBytes);
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

  if (!req.body) {
    return null;
  }

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel("PAYLOAD_TOO_LARGE").catch(() => undefined);
        throw new RangeError("BODY_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(merged)) as unknown;
  } catch {
    return null;
  }
}

function validOptionalText(value: unknown, maxLength = MAX_TEXT_LENGTH): boolean {
  return value === undefined ||
    value === null ||
    (typeof value === "string" && value.length <= maxLength);
}

function isNullableText(value: unknown, maxLength: number): boolean {
  return value === null ||
    (typeof value === "string" && value.length <= maxLength);
}

function isNullableDescriptor(value: unknown): boolean {
  if (value === null) return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const descriptor = value as Record<string, unknown>;
  return (
    isNullableText(descriptor.name, 256) &&
    isNullableText(descriptor.description, 2_000)
  );
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
    item.interaction_capability.length > 0 &&
    item.interaction_capability.length <= 128 &&
    validOptionalText(item.current_value) &&
    (item.confidence === undefined ||
      (typeof item.confidence === "number" &&
        Number.isFinite(item.confidence) &&
        item.confidence >= 0 &&
        item.confidence <= 1))
  );
}

function isKnowledgeEnvelope(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const envelope = value as Record<string, unknown>;
  if (envelope.version !== "1") return false;
  if (
    envelope.local !== undefined &&
    envelope.local !== null &&
    (typeof envelope.local !== "object" || Array.isArray(envelope.local))
  ) return false;

  if (envelope.external === undefined || envelope.external === null) return true;
  if (!envelope.external || typeof envelope.external !== "object" || Array.isArray(envelope.external)) {
    return false;
  }

  const external = envelope.external as Record<string, unknown>;
  const listBounds: Array<[string, number]> = [
    ["sources", 32],
    ["facts", 32],
    ["conflicts", 16],
    ["limitations", 16],
  ];
  for (const [key, max] of listBounds) {
    if (!Array.isArray(external[key]) || (external[key] as unknown[]).length > max) {
      return false;
    }
  }
  return true;
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
    body.intent.length === 0 ||
    body.intent.length > 256 ||
    !isNullableText(body.session_id, 256) ||
    !isNullableText(body.user_id, 256) ||
    !isNullableDescriptor(body.capability) ||
    !isNullableDescriptor(body.skill) ||
    !body.world ||
    typeof body.world !== "object" ||
    Array.isArray(body.world) ||
    !body.constraints ||
    typeof body.constraints !== "object" ||
    Array.isArray(body.constraints) ||
    !Object.prototype.hasOwnProperty.call(body, "knowledge") ||
    !(body.knowledge === null || isKnowledgeEnvelope(body.knowledge)) ||
    !Array.isArray(body.experience) ||
    body.experience.length > MAX_EXPERIENCE_ITEMS ||
    !body.experience.every((item) =>
      item !== null && typeof item === "object" && !Array.isArray(item)
    ) ||
    !Object.prototype.hasOwnProperty.call(body, "offer_workflow") ||
    !(body.offer_workflow === null ||
      (typeof body.offer_workflow === "object" && !Array.isArray(body.offer_workflow))) ||
    !body.metadata ||
    typeof body.metadata !== "object" ||
    Array.isArray(body.metadata)
  ) {
    return false;
  }

  const world = body.world as Record<string, unknown>;
  if (
    !isNullableText(world.active_application, 512) ||
    !isNullableText(world.active_window_title, 2_000) ||
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

  const allowedActions = constraints.allowed_actions;
  if (
    allowedActions !== undefined &&
    (!Array.isArray(allowedActions) ||
      allowedActions.length === 0 ||
      allowedActions.length > MAX_ALLOWED_ACTIONS ||
      !allowedActions.every((item) =>
        typeof item === "string" &&
        item.length > 0 &&
        item.length <= MAX_ALLOWED_ACTION_NAME_LENGTH &&
        SERVER_ALLOWED_ACTIONS.has(item)
      ))
  ) {
    return false;
  }

  return true;
}


function invalidReasoningResponse(task: AgentTaskContract): AgentTaskReasoningResponse {
  return {
    version: task.version,
    task_id: task.task_id,
    status: "manual_review",
    rationale: "NaviMind response did not satisfy the semantic action contract.",
    confidence: 0,
    action: null,
    requires_manual_review: true,
    metadata: { error: "INVALID_AGENT_TASK_RESPONSE" },
  };
}

function validateReasoningResponse(
  task: AgentTaskContract,
  candidate: unknown,
): AgentTaskReasoningResponse {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return invalidReasoningResponse(task);
  }

  const result = candidate as Record<string, unknown>;
  const status = result.status;
  if (
    result.version !== task.version ||
    result.task_id !== task.task_id ||
    (status !== "continue" && status !== "done" && status !== "manual_review") ||
    typeof result.rationale !== "string" ||
    result.rationale.length > MAX_TEXT_LENGTH ||
    typeof result.confidence !== "number" ||
    !Number.isFinite(result.confidence) ||
    result.confidence < 0 ||
    result.confidence > 1 ||
    typeof result.requires_manual_review !== "boolean" ||
    (result.metadata !== undefined &&
      (!result.metadata || typeof result.metadata !== "object" || Array.isArray(result.metadata)))
  ) {
    return invalidReasoningResponse(task);
  }

  if (status !== "continue") {
    if (result.action !== null) return invalidReasoningResponse(task);
    return {
      ...(result as unknown as AgentTaskReasoningResponse),
      requires_manual_review: status === "manual_review" || result.requires_manual_review,
    };
  }

  if (result.requires_manual_review) return invalidReasoningResponse(task);
  const action = result.action;
  if (!action || typeof action !== "object" || Array.isArray(action)) {
    return invalidReasoningResponse(task);
  }

  const proposed = action as Record<string, unknown>;
  const actionName = typeof proposed.name === "string" ? proposed.name.trim() : "";
  const description = typeof proposed.description === "string" ? proposed.description.trim() : "";
  const target = proposed.target === undefined || proposed.target === null
    ? null
    : proposed.target;
  const value = proposed.value === undefined || proposed.value === null
    ? null
    : proposed.value;
  const requiresConfirmation = proposed.requires_confirmation;

  const requestedActions = task.constraints.allowed_actions;
  if (
    !actionName ||
    actionName.length > MAX_ALLOWED_ACTION_NAME_LENGTH ||
    !SERVER_ALLOWED_ACTIONS.has(actionName) ||
    (Array.isArray(requestedActions) && !requestedActions.includes(actionName)) ||
    !description ||
    description.length > MAX_ACTION_DESCRIPTION_LENGTH ||
    !(target === null || (typeof target === "string" && target.length <= MAX_ACTION_TARGET_LENGTH)) ||
    !(value === null || (typeof value === "string" && value.length <= MAX_ACTION_VALUE_LENGTH)) ||
    (requiresConfirmation !== undefined && typeof requiresConfirmation !== "boolean")
  ) {
    return invalidReasoningResponse(task);
  }

  return {
    ...(result as unknown as AgentTaskReasoningResponse),
    action: {
      name: actionName,
      description,
      target: typeof target === "string" ? target : null,
      value: typeof value === "string" ? value : null,
      requires_confirmation: requiresConfirmation === true,
    },
    requires_manual_review: false,
  };
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
      if (!timingSafeSecretMatch(providedSecret, configuredSecret)) {
        return jsonError("UNAUTHORIZED", 401);
      }
    }

    if (!isJsonContentType(req)) {
      return jsonError("UNSUPPORTED_CONTENT_TYPE", 415);
    }

    // The endpoint cannot provide meaningful reasoning without server-side model access.
    // Check this only after authentication so unauthenticated callers cannot inspect config.
    if (!process.env.OPENAI_API_KEY?.trim()) {
      return jsonError("AGENT_PROVIDER_NOT_CONFIGURED", 503);
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
    return NextResponse.json(validateReasoningResponse(body, result));
  } catch {
    // Never log request bodies, auth headers, API keys or provider details.
    console.error("NAVIMIND_AGENT_TASK_ERROR");
    return jsonError("AGENT_TASK_FAILED", 500);
  }
}
