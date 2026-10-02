import type {
  ResearchOptions,
  ResearchProviderResponse,
} from "./researchTypes";

const DEFAULT_TAVILY_URL = "https://api.tavily.com/search";

type TavilyRawResult = {
  title?: unknown;
  url?: unknown;
  content?: unknown;
  score?: unknown;
  published_date?: unknown;
};

type TavilyRawResponse = {
  query?: unknown;
  results?: unknown;
};

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

export async function searchTavily(
  query: string,
  options: ResearchOptions
): Promise<ResearchProviderResponse> {
  const apiKey = process.env.TAVILY_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("TAVILY_API_KEY_NOT_CONFIGURED");
  }

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    options.timeoutMs
  );

  try {
    const response = await fetch(
      process.env.TAVILY_API_URL?.trim() || DEFAULT_TAVILY_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query,
          search_depth: options.searchDepth,
          chunks_per_source: 2,
          max_results: options.maxResults,
          topic: options.topic,
          include_published_date: true,
          include_answer: false,
          include_raw_content: false,
          include_images: false,
          include_favicon: false,
          auto_parameters: false,
          ...(options.includeDomains?.length
            ? { include_domains: options.includeDomains }
            : {}),
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw new Error(`TAVILY_HTTP_${response.status}`);
    }

    const payload = (await response.json()) as TavilyRawResponse;

    if (!Array.isArray(payload.results)) {
      throw new Error("TAVILY_INVALID_RESULTS");
    }

    const results = payload.results.flatMap((item: unknown) => {
      if (!item || typeof item !== "object") return [];

      const raw = item as TavilyRawResult;
      const title = nonEmptyString(raw.title);
      const url = nonEmptyString(raw.url);
      const content = nonEmptyString(raw.content);

      if (!title || !url || !content) return [];

      try {
        const parsed = new URL(url);

        if (
          parsed.protocol !== "http:" &&
          parsed.protocol !== "https:"
        ) {
          return [];
        }
      } catch {
        return [];
      }

      const score =
        typeof raw.score === "number" &&
        Number.isFinite(raw.score) &&
        raw.score >= 0 &&
        raw.score <= 1
          ? raw.score
          : undefined;

      const publishedDate =
        typeof raw.published_date === "string"
          ? raw.published_date.trim() || null
          : null;

      return [
        {
          title,
          url,
          content,
          ...(score !== undefined ? { score } : {}),
          published_date: publishedDate,
        },
      ];
    });

    return {
      query:
        nonEmptyString(payload.query) ||
        query,
      results,
    };
  } finally {
    clearTimeout(timer);
  }
}