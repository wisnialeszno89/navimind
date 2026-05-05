export function detectProgress(userText: string, history: string[]): string | null {
  const t = userText.toLowerCase();

  // 🔥 zmiana języka (z chaosu → refleksja)
  if (/chyba|mam wrażenie|zaczynam/.test(t)) {
    return "zaczynasz na to patrzeć trochę inaczej";
  }

  // 🔥 mniej emocji
  if (/ok|rozumiem|no dobra/.test(t)) {
    return "trochę już to układasz w głowie";
  }

  // 🔥 działanie
  if (/zrobiłem|spróbowałem|ogarnąłem/.test(t)) {
    return "zrobiłeś już jakiś ruch, nie stoisz w miejscu";
  }

  return null;
}