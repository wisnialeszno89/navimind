import { UserProfile } from "./userProfile";

export function buildTone(profile: UserProfile): string {
  if (profile.communication === "soft") {
    return `
Mów spokojniej.
Daj poczucie bezpieczeństwa.
Nie ciśnij.
`;
  }

  if (profile.communication === "analytical") {
    return `
Mów logicznie i strukturalnie.
Wyjaśniaj.
`;
  }

  return `
Mów konkretnie.
Bez owijania.
Prowadź.
`;
}