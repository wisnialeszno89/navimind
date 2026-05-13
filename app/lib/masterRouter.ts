export function isContextDependent(text: string) {
  const t = text.trim().toLowerCase();

  return /^(a jeśli|ale|i co|czemu|dlaczego|po co|jak to|to czemu|i dlatego|czyli|poleć|daj|a jakiś|jakiegoś|ten drugi|inne|inny|a gdzie|ile kosztuje)/i.test(
    t
  );
}

export function routeResponse(
  userText: string,
  history: any[] = []
): "crisis" | "action" | "explore" | "default" {
  const t = userText.toLowerCase();

  // 🔥 jeśli pytanie zależy od kontekstu
  // NIE zmieniaj trybu agresywnie
  if (isContextDependent(t)) {
    return "default";
  }

  // 🔥 kryzys
  if (/zmarł|zmarła|śmierć|nie mam po co żyć/.test(t)) {
    return "crisis";
  }

  // 🔥 explore
  if (/gdzie|pomysł|polecisz|majówk|wyjazd/.test(t)) {
    return "explore";
  }

  // 🔥 action tylko gdy rzeczywiście chodzi o działanie
  if (
    /co zrobić|jak zrobić|jak mam|jak mogę/.test(t)
  ) {
    return "action";
  }

  return "default";
}

