import type {
  IntelligenceState,
  RuntimeContext,
  UserContext,
  ContinuityState,
  InternalState,
} from "./chatTypes";

type Input = {
  intelligence: IntelligenceState;

  runtimeContext: RuntimeContext;

  userContext: UserContext;

  continuity: ContinuityState;

  internalState: InternalState;
  topicAnchors: string[];
};

export function buildAIState({
  intelligence,
  runtimeContext,
  userContext,
  continuity,
  internalState,
  topicAnchors,
}: Input) {
  return {
    intelligence,
    runtimeContext,
    userContext,
    continuity,
    internalState,
    topicAnchors,    
  };
}