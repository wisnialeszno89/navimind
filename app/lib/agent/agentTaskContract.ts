import type { AgentKnowledgeEnvelope } from "./knowledgeContext";

export type AgentTaskWorldElement = {
  kind: string;
  label: string | null;
  interaction_capability: string;
  current_value?: string;
  confidence?: number;
};

export type AgentTaskContract = {
  version: string;
  task_id: string;
  goal: string;
  intent: string;
  session_id: string | null;
  user_id: string | null;
  capability: {
    name: string | null;
    description: string | null;
  } | null;
  skill: {
    name: string | null;
    description: string | null;
  } | null;
  world: {
    active_application: string | null;
    active_window_title: string | null;
    visible_elements: AgentTaskWorldElement[];
    element_count: number;
  };
  offer_workflow: Record<string, unknown> | null;
  knowledge: AgentKnowledgeEnvelope | null;
  experience: Record<string, unknown>[];
  constraints: {
    semantic_only: boolean;
    max_actions: number;
    verify_each_action: boolean;
    [key: string]: unknown;
  };
  metadata: Record<string, unknown>;
};

export type AgentTaskAction = {
  name: string;
  description: string;
  target?: string | null;
  value?: string | null;
  requires_confirmation?: boolean;
};

export type AgentTaskReasoningResponse = {
  version: string;
  task_id: string;
  status: "continue" | "done" | "manual_review";
  rationale: string;
  confidence: number;
  action: AgentTaskAction | null;
  requires_manual_review: boolean;
  metadata?: Record<string, unknown>;
  knowledge?: AgentKnowledgeEnvelope | null;
};
