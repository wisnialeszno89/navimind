export function welcomeEmail() {
  return {
    subject: "Dobrze, że jesteś.",
    html: `
      <h2>Witaj w NaviMind</h2>
      <p>To przestrzeń, w której ktoś naprawdę słucha.</p>
      <p>Możesz wrócić kiedy chcesz. NaviMind będzie tutaj.</p>
      <br/>
      <a href="https://navimind.app/chat">Wróć do rozmowy</a>
    `,
  };
}

export function day1Email() {
  return {
    subject: "Jak się dziś masz?",
    html: `
      <p>Czasem jeden dzień potrafi zmienić wszystko.</p>
      <p>Jeśli chcesz — możesz po prostu napisać jedno zdanie.</p>
      <br/>
      <a href="https://navimind.app/chat">Napisz do NaviMind</a>
    `,
  };
}

export function day3Email() {
  return {
    subject: "Nie musisz z tym być sam.",
    html: `
      <p>Nie wiemy, co się u Ciebie dzieje.</p>
      <p>Ale jeśli potrzebujesz chwili rozmowy — NaviMind jest.</p>
      <br/>
      <a href="https://navimind.app/chat">Wróć na chwilę</a>
    `,
  };
}

export function day7ProEmail() {
  return {
    subject: "Głębsze wsparcie w NaviMind",
    html: `
      <p>Jeśli czujesz, że zwykła rozmowa to za mało —</p>
      <p>w NaviMind PRO masz głębszą pamięć, więcej rozmów i pełne wsparcie.</p>
      <br/>
      <a href="https://navimind.app/pro">Zobacz NaviMind PRO</a>
    `,
  };
}
