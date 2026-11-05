export function getWelcomeMessage(lang: "pl" | "en") {
  if (lang === "pl") {
    return `Cześć! Możemy po prostu pogadać albo zająć się konkretnym zadaniem.

Napisz własnymi słowami, co chcesz zrobić. Pomogę to rozpracować, przygotować albo wykonać tam, gdzie mam dostęp do odpowiednich narzędzi.`;
  }

  return `Hi! We can just talk or work through a specific task.

Tell me what you want to do in your own words. I'll help plan, prepare, or execute it when the right tools are available.`;
}
