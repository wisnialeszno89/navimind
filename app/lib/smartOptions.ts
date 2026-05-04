export function buildOptionsPrompt(userText: string, userProfile?: any) {
  const style = userProfile?.communication || "direct";

  return `
Użytkownik ma sytuację:
"${userText}"

Styl komunikacji użytkownika: ${style}
Dostosuj ton opcji do tego stylu.

Twoim zadaniem NIE jest rozwiązanie za niego.

Twoim zadaniem jest:
- dać mu 3 różne kierunki działania
- każdy ma być realny
- każdy ma mieć sens
- mają się różnić podejściem

ZASADY:
- krótko
- konkretnie
- bez gadania
- bez tłumaczenia

FORMAT:
1. ...
2. ...
3. ...

NIE:
- nie oceniaj
- nie mów co najlepsze
- nie wybieraj za niego
`;
}