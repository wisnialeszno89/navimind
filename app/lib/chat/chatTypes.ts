export type IntelligenceState =
{
  analysis: any;

  intent: string;

  localIntent: boolean;

  violenceRisk: boolean;
};

export type RuntimeContext =
{
  conversationState: any;

  summary: string;

  entityContext: string;
};

export type EmotionalProfile =
{
  abandonmentFear: boolean;

  overload: boolean;

  controlNeed: boolean;

  validationSeeking: boolean;
};

export type UserContext =
{
  memory: any;

  patterns: any[];

  userType: string;

  userStyle: string;

  identity: any;

  userProfile: any;

  emotionalProfile: EmotionalProfile;

  activeTopic: string;

  memoryPriority: {
  scores: Record<
    string,
    number
  >;

  topPriority: string;
};
};

export type ContinuityState =
{
  isContinuation: boolean;
};

export type InternalState =
{
  emotionalTension: string;

  clarityLevel: string;

  conversationDepth: string;

  trustLevel: string;
};
export type AIState =
{
  intelligence: IntelligenceState;

  runtimeContext: RuntimeContext;

  userContext: UserContext;

  continuity: ContinuityState;

  internalState: InternalState;

  topicAnchors: string[];
};