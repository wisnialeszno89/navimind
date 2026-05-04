type Identity = {
  mainSituation?: string;
  userType?: string;
  patterns?: string[];
  lastUpdated?: number;
};

const identityStore = new Map<string, Identity>();

export function updateUserIdentity(userId: string, text: string) {
  const lower = text.toLowerCase();
  const current = identityStore.get(userId) || {};

  // 🔥 sytuacja życiowa
  if (/żona|była|rozwód/.test(lower)) {
    current.mainSituation = "konflikt z byłą partnerką";
  }

  if (/sąd|pozew|prawnik/.test(lower)) {
    current.mainSituation = "sytuacja prawna";
  }

  // 🔥 typ usera (jak działa)
  if (/mam dowody|sprawdzam|analizuje/.test(lower)) {
    current.userType = "analityczny";
  }

  if (/wkurza mnie|mam dość|nie ogarniam/.test(lower)) {
    current.userType = "emocjonalny";
  }

  current.lastUpdated = Date.now();

  identityStore.set(userId, current);
}

export function getUserIdentity(userId: string): Identity {
  return identityStore.get(userId) || {};
}