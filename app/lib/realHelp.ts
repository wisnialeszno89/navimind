export function injectRealHelp(userText: string, route: string): string | null {
  const t = userText.toLowerCase();

  if (/dzieci|psycholog/.test(t)) {
    return `Realnie teraz najszybciej działa:

- psycholog online (ZnanyLekarz / Therapify / Mindgram)
- fundacje i wsparcie kryzysowe dla dzieci (często szybciej niż NFZ)
- prywatni terapeuci poza dużymi miastami (krótsze kolejki)

Jak chcesz, znajdę Ci konkretne opcje pod Twoją lokalizację.`;
  }

  return null;
}