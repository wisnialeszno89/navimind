export function analyzeConversationStep(userText: string, aiText: string) {
  return {
    userLength: userText.length,
    aiLength: aiText.length,
    isShortReply: userText.length < 20,
    containsEmotion: /mam dość|wkurza|męczy|irytuje/.test(
      userText.toLowerCase()
    ),
  };
}