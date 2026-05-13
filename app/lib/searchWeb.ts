export async function searchWeb(
  query: string
) {
  try {
    const res = await fetch(
      "https://api.tavily.com/search",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          api_key:
            process.env.TAVILY_API_KEY,
          query: `
          Znajdź oficjalne strony WWW,
          kontakty i informacje:

          ${query}
          `,
          search_depth: "basic",
          include_answer: true,
          max_results: 5,
        }),
      }
    );

    const data = await res.json();

    return data?.results || [];
  } catch (e) {
    console.error(e);
    return [];
  }
}