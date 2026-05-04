export function preventDeadEnd(text: string, userText: string): string {
  if (/nie wiem|ciężko|sam nie wiem/.test(userText.toLowerCase())) {
    return text + "\n\nZłapmy to razem — najczęściej to kręci się wokół jednej rzeczy, która najbardziej cię teraz dobija.";
  }

  return text;
}