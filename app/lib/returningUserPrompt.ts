export function getReturningUserPrompt(visits?: number, lastSeenAt?: number) {
  if (!visits || visits <= 1) return "";

  const now = Date.now();
  const diffDays = lastSeenAt
    ? Math.floor((now - lastSeenAt) / (1000 * 60 * 60 * 24))
    : 0;

  /* ===== brak długiej nieobecności ===== */
  if (diffDays < 3) {
    return `
Jeśli to kolejna rozmowa:
możesz subtelnie zaznaczyć ciągłość, np. krótkim:
"dobrze, że jesteś" albo "jestem".

Bez patosu. Bez wielkich powitań.
`;
  }

  /* ===== 3–7 dni ===== */
  if (diffDays >= 3 && diffDays < 7) {
    return `
Użytkownik wrócił po kilku dniach ciszy.

Możesz bardzo lekko zaznaczyć obecność:
"miło, że wróciłeś"
"jestem tu"

Krótko. Ciepło. Bez dramatu.
`;
  }

  /* ===== 7–30 dni ===== */
  if (diffDays >= 7 && diffDays < 30) {
    return `
Użytkownika nie było dłużej.

Możesz użyć spokojnego, ludzkiego tonu:
"dobrze Cię znowu widzieć"
"co u Ciebie przez ten czas?"

Jedno zdanie. Bez przesady.
`;
  }

  /* ===== 30+ dni ===== */
  if (diffDays >= 30) {
    return `
To powrót po bardzo długim czasie.

Ton:
spokojny, życzliwy, nienarzucający się.

Możesz:
"minęło trochę czasu… dobrze, że jesteś"
i przejść naturalnie do rozmowy.

Bez pytań typu raport.
Bez analizowania zniknięcia.
`;
  }

  return "";
}
