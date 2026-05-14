type Input = {
  userText: string;
  lastAssistant: string;
  shortFollowup: boolean;
  historyLength: number;
};

export function buildFollowupContext({
  userText,
  lastAssistant,
  shortFollowup,
  historyLength,
}: Input) {
  let contextualUserText =
    userText;

  if (
    shortFollowup &&
    historyLength > 0
  ) {
    contextualUserText = `
KONTEKST POPRZEDNIEJ ODPOWIEDZI:
${lastAssistant}

NOWA WIADOMOŚĆ:
${userText}

To jest kontynuacja poprzedniego tematu.

Nie resetuj rozmowy.
Nie pytaj ponownie o kontekst.
`;
  }

  return {
    contextualUserText,
  };
}