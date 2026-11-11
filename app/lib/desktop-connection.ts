const BRIDGE = "http://127.0.0.1:43127";

export function pairingCode(value: string) {
  // Accept copying the labelled terminal line as well as the clipboard's bare code.
  const token = value.trim().replace(/^KOD_PAROWANIA\s*=\s*/i, "").trim();
  if (!/^[A-Za-z0-9_-]{40,80}$/.test(token)) throw new Error("Wklej kod parowania z aktualnego okna PowerShell. Możesz wkleić cały wiersz KOD_PAROWANIA=…");
  return token;
}

// Pairing credentials travel only to loopback, never to the model or Vercel.
export async function localRequest<T = any>(token: string, path: string, body?: unknown): Promise<T> {
  if (path !== "/status" && path !== "/execute" && !/^\/result\/[a-zA-Z0-9-]{16,80}$/.test(path)) throw new Error("Nieprawidłowy adres lokalnego zadania.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), body === undefined ? 10000 : 90000);
  try {
    const options: RequestInit & { targetAddressSpace?: string } = {
      method: body === undefined ? "GET" : "POST",
      headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      mode: "cors", credentials: "omit", cache: "no-store",
      signal: controller.signal, targetAddressSpace: "loopback",
    };
    if (body !== undefined) options.body = JSON.stringify(body);
    const response = await fetch(BRIDGE + path, options);
    if (response.status === 403) throw new Error("Wykonawca odrzucił parowanie. Wklej najnowszy kod z otwartego PowerShella i użyj strony https://www.navimind.app/workspace.");
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Lokalny wykonawca zwrócił błąd. Sprawdź jego okno PowerShell.");
    return result;
  } catch (problem) {
    if (controller.signal.aborted) throw new Error("Brak odpowiedzi lokalnego wykonawcy. Sprawdź, czy nadal działa w PowerShell. Przeglądarka może wymagać zezwolenia na dostęp do komputera lokalnego.");
    if (problem instanceof TypeError) throw new Error("Przeglądarka nie dotarła do wykonawcy pod 127.0.0.1:43127. Sprawdź otwarte okno PowerShell oraz ewentualne pytanie przeglądarki o dostęp lokalny. Nie zmieniaj ustawień zabezpieczeń całej przeglądarki.");
    throw problem;
  } finally { clearTimeout(timer); }
}
