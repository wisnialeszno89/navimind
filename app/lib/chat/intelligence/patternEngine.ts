export function detectPattern(text: string): string | null {
  const t = text.toLowerCase();

  if (/znowu|ciągle|zawsze|kolejny raz/.test(t)) {
    if (/ludzie|toksyczni/.test(t)) {
      return "wracasz do tematu ludzi i frustracji";
    }

    if (/praca|szef/.test(t)) {
      return "problem z pracą się powtarza";
    }

    if (/związek|ona|on/.test(t)) {
      return "ten sam schemat relacyjny wraca";
    }

    return "pewien schemat zaczyna się powtarzać";
  }

  return null;
}