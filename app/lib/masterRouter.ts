export function routeResponse(userText: string): "crisis" | "action" | "explore" | "default" {
  const t = userText.toLowerCase();

  // 🔥 kryzys MA pierwszeństwo tylko jeśli to główny temat
  if (/zmarł|zmarła|śmierć|nie mam po co żyć/.test(t)) {
    return "crisis";
  }

  // 🔥 jeśli user chce gdzieś jechać → explore wygrywa
  if (/gdzie|pomysł|polecisz|majówk|wyjazd/.test(t)) {
    return "explore";
  }

  if (/co zrobić|jak/.test(t)) {
    return "action";
  }

  return "default";
}