export const texts = {
  pl: {
    /* ================= LANDING ================= */
    tagline: "Rozmowa bardziej po ludzku.",
    subtitle: "Możesz pogadać, uporządkować myśli albo przeanalizować dokument.",
    startChat: "Przejdź do rozmowy →",

    /* ================= APP / CHAT ================= */
    demo: "Demo",
    messages: "wiadomości",
    reset: "reset za",

    chatGreeting:
      "Hej 👋\n\nCo u Ciebie słychać?\n\nChcesz pogadać, przeanalizować PDF albo spojrzeć na zdjęcie?",

    demoFooter: "Demo · 20 wiadomości / 24h · 1 zdjęcie / dzień",

    // ✅ NOWE: teksty widoczne w czacie (góra + dół)
    privacyBanner: "🔒 Rozmowa prywatna — widoczna tylko dla Ciebie",
    limitRemaining: "Pozostało",
    limitOf: "z",
    limitDemoSuffix: "wiadomości (demo)",
    proHistoryNote: "Historia rozmów w wersji PRO",

    // ✅ NOWE: przy sprawdzaniu limitu (fallback)
    checkingLimit: "Sprawdzam limit…",
    limitLoadFailed: "Limit demo: nie udało się pobrać danych",
    demoLimitReached: "Limit demo osiągnięty — wróć za",

    /* ================= PRO ================= */
    pro: "PRO",
    proDesc:
      "Wersja PRO jest w przygotowaniu. Pojawi się m.in. więcej wiadomości, tryb rozszerzony i funkcje live.",

    /* ================= CONTACT ================= */
    contact: "Kontakt",
    contactTitle: "Masz uwagę, pomysł albo coś nie zagrało?",
    contactSubtitle: "Napisz. Czytam wszystko.",
    contactName: "Imię (opcjonalnie)",
    contactEmail: "Email (opcjonalnie)",
    contactMessage: "Wiadomość",
    contactSend: "Wyślij wiadomość",
    contactSuccess: "Dzięki. Wiadomość dotarła 👍",
    contactError: "Coś poszło nie tak. Spróbuj później.",
    contactFooter:
      "Nie spamuję. Nie zapisuję Cię nigdzie. To trafia bezpośrednio do mnie.",

    /* ================= LEGAL ================= */
    terms: "Regulamin",
  },

  en: {
    /* ================= LANDING ================= */
    tagline: "A more human conversation.",
    subtitle: "Talk things through or work with a document.",
    startChat: "Start chatting →",

    /* ================= APP / CHAT ================= */
    demo: "Demo",
    messages: "messages",
    reset: "reset in",

    chatGreeting:
      "Hi 👋\n\nHow are you?\n\nDo you want to chat, analyze a PDF, or look at a photo?",

    demoFooter: "Demo · 20 messages / 24h · 1 image / day",

    // ✅ NEW: chat texts (top + bottom)
    privacyBanner: "🔒 Private chat — visible only to you",
    limitRemaining: "Remaining",
    limitOf: "of",
    limitDemoSuffix: "messages (demo)",
    proHistoryNote: "Chat history in PRO",

    // ✅ NEW: limit UI helper texts
    checkingLimit: "Checking limit…",
    limitLoadFailed: "Demo limit: failed to load",
    demoLimitReached: "Demo limit reached — come back in",

    /* ================= PRO ================= */
    pro: "PRO",
    proDesc:
      "The PRO version is under development. It will include more messages, extended mode, and live features.",

    /* ================= CONTACT ================= */
    contact: "Contact",
    contactTitle: "Got feedback, an idea, or something didn’t work?",
    contactSubtitle: "Write to me. I read everything.",
    contactName: "Name (optional)",
    contactEmail: "Email (optional)",
    contactMessage: "Message",
    contactSend: "Send message",
    contactSuccess: "Thanks. Your message has been delivered 👍",
    contactError: "Something went wrong. Please try again later.",
    contactFooter: "No spam. No mailing lists. This goes directly to me.",

    /* ================= LEGAL ================= */
    terms: "Terms",
  },
} as const;