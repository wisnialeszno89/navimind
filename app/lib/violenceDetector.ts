export function detectViolenceRisk(text: string) {
  const t = text.toLowerCase();

  const highRiskPatterns = [
    /lufe do skroni/,
    /zabij/,
    /potracic autem/,
    /wpierdolic/,
    /skopac/,
    /bedzie bal sie z domu wychodzic/,
    /pozbierac kolegow/,
    /zemsta jest silniejsza/,
    /rozjebac/,
    /pobić/,
    /spalić/,
    /opluć/,
  ];

  return highRiskPatterns.some((r) => r.test(t));
}