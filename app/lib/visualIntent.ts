export function shouldShowImages(
  userText: string
): boolean {
  const t = userText.toLowerCase();

  return /zdję|foto|pokaż|jak wygląda|inspirac|camper|van|fryzur|tatuaż|wnętrz|mechanik|samoch|styl|siłown|hotel|miejsce|podróż/.test(
    t
  );
}