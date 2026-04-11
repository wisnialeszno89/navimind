import { UserState } from "./detectUserState";

export function emotionalLayer(state: UserState): string {
  switch (state) {
    case 1:
      return `
TRYB EMOCJONALNY LEKKI:
- mniej humoru
- więcej spokoju
- max 3 konkretne kroki
- krótsze zdania
`;

    case 2:
      return `
TRYB GŁĘBOKIEGO OTWARCIA:
- najpierw obecność, nie porady
- zero żartów
- bez formalnego tonu
- mów naturalnie jak w rozmowie
- maksymalnie 1 pytanie na końcu
- wolniejsze, spokojne tempo
`;

    case 3:
      return `
TRYB KRYZYSOWY:
- absolutny spokój i prosty język
- żadnego coachingu ani filozofii
- skupienie na bezpieczeństwie i realnym wsparciu
- delikatna sugestia kontaktu z kimś bliskim lub specjalistą
- zero presji
`;

    default:
      return ``;
  }
}
