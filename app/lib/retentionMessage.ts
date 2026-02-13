import { getLastActive } from "./lastActive";


const DAY = 1000 * 60 * 60 * 24;


/**
* Buduje krótką wiadomość powrotu po kilku dniach ciszy
* BEZ AI → zero kosztów
*/
export async function getRetentionMessage(userId: string): Promise<string | null> {
const last = await getLastActive(userId);


if (!last) return null;


const days = Math.floor((Date.now() - last) / DAY);


if (days < 3) return null;


if (days >= 3 && days < 7) {
return "Chwilę Cię nie było. Jak dziś u Ciebie?";
}


if (days >= 7) {
return "Minęło trochę czasu. Jeśli chcesz, możemy spokojnie wrócić od małego kroku.";
}


return null;
}