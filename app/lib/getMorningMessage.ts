import { getLastDayMemory } from "./dayMemory";


/**
* Buduje jedno krótkie zdanie poranne dla PRO+
* BEZ użycia AI → brak kosztów
*/
export async function getMorningMessage(userId: string): Promise<string | null> {
const lastDay = await getLastDayMemory(userId);


if (!lastDay) return null;


const step = lastDay.microStep?.trim();


if (!step) return null;


return `Dziś możesz zacząć spokojnie od jednej małej rzeczy: ${step}`;
}