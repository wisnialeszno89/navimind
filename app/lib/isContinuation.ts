export function isContinuation(text: string) {
  const t = text.trim().toLowerCase();

  if (t.split(" ").length <= 6) {
    return true;
  }

  return /^(tak|no|dawaj|okej|ok|jasne|dokładnie|właśnie|ten|tam|dalej|i co|mówię o|chodzi mi o)/i.test(
    t
  );
}