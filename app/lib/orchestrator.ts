import { routeResponse } from "./masterRouter";
import { crisisOverride } from "./crisisOverride";
import { actionOverride } from "./actionOverride";
import { exploreOverride } from "./exploreOverride";
import { injectRealHelp } from "./realHelp";

import type { ConversationState } from "./conversationState";

export function orchestrateResponse(
  userText: string,
  base: string,
  history: any[],
  conversationState: ConversationState
): string {

  let output = base;

  // 🔥 ROUTING Z PEŁNYM KONTEKSTEM
  const route = routeResponse(
    userText,
    history,
    conversationState
  );

  // 🔥 TRYB ODPOWIEDZI
  if (route === "crisis") {
    output = crisisOverride(
      userText,
      output
    );

  } else if (route === "action") {
    output = actionOverride(
      userText,
      output
    );

  } else if (route === "explore") {
    output = exploreOverride(
      userText,
      output
    );
  }

  // 🔥 DODATKOWA PRAKTYCZNA POMOC
  const helpText =
    injectRealHelp(
      userText,
      route
    );

  if (helpText) {
    output += "\n\n" + helpText;
  }

  return output.trim();
}