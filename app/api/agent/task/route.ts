import { NextResponse } from "next/server";
import {
  reasonAgentTask,
} from "@/lib/agent/reasonAgentTask";
import type {
  AgentTaskContract,
} from "@/lib/agent/agentTaskContract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const configuredSecret =
      process.env.NAVIMIND_AGENT_SECRET?.trim();

    if (configuredSecret) {
      const providedSecret =
        req.headers
          .get("x-navimind-agent-secret")
          ?.trim() || "";

      if (
        !providedSecret ||
        providedSecret !== configuredSecret
      ) {
        return NextResponse.json(
          { error: "UNAUTHORIZED" },
          { status: 401 }
        );
      }
    }

    const body =
      (await req.json().catch(() => null)) as
        | AgentTaskContract
        | null;

    if (
      !body ||
      typeof body !== "object" ||
      typeof body.goal !== "string" ||
      typeof body.task_id !== "string" ||
      !body.world ||
      typeof body.world !== "object"
    ) {
      return NextResponse.json(
        { error: "INVALID_AGENT_TASK" },
        { status: 400 }
      );
    }

    if (
      body.version !== "1" &&
      body.version !== undefined
    ) {
      return NextResponse.json(
        { error: "UNSUPPORTED_AGENT_TASK_VERSION" },
        { status: 400 }
      );
    }

    const result =
      await reasonAgentTask(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "NAVIMIND_AGENT_TASK_ERROR",
      error
    );

    return NextResponse.json(
      {
        error: "AGENT_TASK_FAILED",
      },
      { status: 500 }
    );
  }
}
