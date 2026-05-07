export function formatResponse(text: string): string {
  let output = text.trim();

  // 🔹 lepsze odstępy po zdaniach
  output = output.replace(/\.\s+/g, ".\n\n");

  // 🔹 listy
  output = output.replace(/•/g, "\n• ");

  // 🔹 lekkie wizualne anchor points
  output = output
    .replace(/Największy problem:/gi, "⚠️ Największy problem:")
    .replace(/Najważniejsze:/gi, "📌 Najważniejsze:")
    .replace(/Dobry ruch:/gi, "✅ Dobry ruch:")
    .replace(/Warto:/gi, "💡 Warto:");

  // 🔹 usuń przesadne odstępy
  output = output.replace(/\n{3,}/g, "\n\n");

  return output.trim();
}