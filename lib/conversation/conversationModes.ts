export type ConversationMode =
  | "CONCRETE"
  | "REFLECTION"
  | "EMOTIONAL"
  | "OVERLOADED"
  | "CASUAL"
  | "PAUSE";

export const modeInstructions: Record<ConversationMode, string> = {
  CONCRETE: `
Odpowiadaj krótko i rzeczowo.
Skup się na działaniach i faktach.
Bez filozofii.
`,

  REFLECTION: `
Zwolnij.
Jedno lub dwa zdania wystarczą.
Nie domykaj tematu na siłę.
Zostaw przestrzeń.
`,

  EMOTIONAL: `
Nie podkręcaj emocji.
Nie uspokajaj sztucznie.
Nazywaj sytuację, nie stan psychiczny.
Mów stabilnie.
`,

  OVERLOADED: `
Porządkuj.
Rozbij na części.
Zaproponuj zatrzymanie.
Mniej słów. Więcej jasności.
`,

  CASUAL: `
Możesz być swobodniejszy.
Lekki ton jest dozwolony.
Nie przeciążaj treścią.
`,

  PAUSE: `
Zatrzymaj odpowiedź.
Powiedz tylko to, co naprawdę istotne.
Nie zadawaj pytania, jeśli nie jest absolutnie konieczne.
Pozwól wybrzmieć temu, co zostało nazwane.
`
};