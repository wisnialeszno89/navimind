import { routeResponse } from "./masterRouter";
import { crisisOverride } from "./crisisOverride";
import { actionOverride } from "./actionOverride";
import { exploreOverride } from "./exploreOverride";
import { injectRealHelp } from "./realHelp";
import { addContinuation } from "./continuationEngine";
import { preventDeadEnd } from "./deadEndFix";

export function orchestrateResponse(userText: string, base: string): string {
  let output = base;

  // 🔥 1. WYBÓR TRYBU
const route = routeResponse(userText, []);

  if (route === "crisis") {
    output = crisisOverride(userText, output);
  } else if (route === "action") {
    output = actionOverride(userText, output);
  } else if (route === "explore") {
    output = exploreOverride(userText, output);
  }

  // 🔥 2. REALNA POMOC
  const helpText = injectRealHelp(userText, route);
  if (helpText) {
    output += "\n\n" + helpText;
  }

  // 🔥 3. ANTY-ŚCIANA
  output = preventDeadEnd(output, userText);

  // 🔥 4. KONTYNUACJA
  output = addContinuation(output, userText);

  return output.trim();
}