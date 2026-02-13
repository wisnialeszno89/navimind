export function getWelcomeMessage(lang: "pl" | "en") {
  if (lang === "pl") {
    return `Cześć.

Możesz napisać tu wszystko — bez oceniania.

Co jest dziś dla Ciebie najtrudniejsze?`;
  }

  return `Hi.

You can write anything here — no judgment.

What feels the hardest today?`;
}
