import type { AgentKnowledgeSourceQuality } from "../knowledgeContext";
import type { ResearchSearchResult } from "./researchTypes";

const GERMAN_OFFICIAL_EXACT = new Set([
  "gesetze-im-internet.de",
  "dibt.de",
  "baua.de",
  "umweltbundesamt.de",
  "bafa.de",
  "bundesregierung.de",
  "eur-lex.europa.eu",
  "europa.eu",
  "ec.europa.eu",
]);

const GERMAN_OFFICIAL_SUFFIXES = [
  ".bund.de",
];

const INSTITUTIONAL_DOMAINS = new Set([
  "din.de",
  "ift-rosenheim.de",
  "dena.de",
  "kfw.de",
  "vdi.de",
]);

const TARGET_YEAR_PATTERN = /\b(20\d{2})\b/;

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isGermanJurisdictionQuery(query: string): boolean {
  return /\b(deutschland|germany|german|niemcy|niemieck|bundesrepublik)\b/i.test(
    query
  );
}

function authorityScoreForDomain(
  domain: string,
  germanJurisdiction: boolean
): {
  score: number;
  tier: AgentKnowledgeSourceQuality["tier"];
  reason: string;
} {
  if (
    GERMAN_OFFICIAL_EXACT.has(domain) ||
    GERMAN_OFFICIAL_SUFFIXES.some((suffix) => domain.endsWith(suffix)) ||
    domain.endsWith(".gov") ||
    domain.includes(".gov.")
  ) {
    return {
      score: 1,
      tier: "authoritative",
      reason: "Official government, regulator or EU source domain.",
    };
  }

  if (INSTITUTIONAL_DOMAINS.has(domain)) {
    return {
      score: 0.82,
      tier: "institutional",
      reason: "Recognized standards, research or public-interest institution domain.",
    };
  }

  if (germanJurisdiction && domain.endsWith(".de")) {
    return {
      score: 0.62,
      tier: "established",
      reason: "German-domain source; authority is not established by the domain alone.",
    };
  }

  if (
    domain.endsWith(".org") ||
    domain.endsWith(".edu") ||
    domain.endsWith(".ac.uk")
  ) {
    return {
      score: 0.58,
      tier: "established",
      reason: "Institutional-style domain; publisher authority still requires verification.",
    };
  }

  return {
    score: 0.38,
    tier: "low_confidence",
    reason: "Publisher authority is not established by domain heuristics.",
  };
}

function temporalFit(
  query: string,
  publishedDate: string | null | undefined
): {
  score: number;
  reason: string;
} {
  const targetMatch = query.match(TARGET_YEAR_PATTERN);
  const targetYear = targetMatch ? Number(targetMatch[1]) : null;

  if (!publishedDate) {
    return {
      score: targetYear !== null ? 0.35 : 0.4,
      reason:
        targetYear !== null
          ? "Publication date missing; fit to the requested year cannot be verified."
          : "Publication date missing; freshness cannot be verified.",
    };
  }

  const timestamp = Date.parse(publishedDate);
  if (!Number.isFinite(timestamp)) {
    return {
      score: 0.3,
      reason: "Publication date is present but could not be parsed reliably.",
    };
  }

  const publishedYear = new Date(timestamp).getUTCFullYear();

  if (targetYear !== null) {
    if (publishedYear === targetYear) {
      return {
        score: 1,
        reason: `Publication year matches requested year ${targetYear}.`,
      };
    }

    if (publishedYear > targetYear) {
      const distance = publishedYear - targetYear;
      return {
        score: Math.max(0.7, 1 - Math.min(distance, 6) * 0.06),
        reason: `Publication is newer than requested year ${targetYear}; verify whether the later source supersedes it.`,
      };
    }

    const distance = targetYear - publishedYear;
    return {
      score: Math.max(0.35, 1 - Math.min(distance, 6) * 0.1),
      reason: `Publication predates requested year ${targetYear}; later amendments may exist.`,
    };
  }

  const ageYears =
    Math.max(0, Date.now() - timestamp) /
    (365.25 * 24 * 60 * 60 * 1000);

  if (ageYears <= 1) {
    return {
      score: 1,
      reason: "Published within the last year.",
    };
  }

  if (ageYears <= 2) {
    return {
      score: 0.85,
      reason: "Published within the last two years.",
    };
  }

  if (ageYears <= 4) {
    return {
      score: 0.7,
      reason: "Published within the last four years.",
    };
  }

  if (ageYears <= 7) {
    return {
      score: 0.55,
      reason: "Source is older; freshness should be checked.",
    };
  }

  return {
    score: 0.4,
    reason: "Source is old relative to a current-information request.",
  };
}

function topicalFit(
  providerScore: number | undefined
): {
  score: number;
  reason: string;
} {
  if (
    typeof providerScore === "number" &&
    Number.isFinite(providerScore)
  ) {
    const score = Math.max(0, Math.min(1, providerScore));

    return {
      score,
      reason: `Tavily relevance score: ${score.toFixed(2)}.`,
    };
  }

  return {
    score: 0.45,
    reason: "No provider relevance score was supplied.",
  };
}

export function assessResearchSource(
  query: string,
  result: ResearchSearchResult
): AgentKnowledgeSourceQuality {
  const domain = hostFromUrl(result.url);
  const authority = authorityScoreForDomain(
    domain,
    isGermanJurisdictionQuery(query)
  );
  const temporal = temporalFit(query, result.published_date);
  const topical = topicalFit(result.score);

  const score = Math.max(
    0,
    Math.min(
      1,
      authority.score * 0.5 +
        temporal.score * 0.3 +
        topical.score * 0.2
    )
  );

  let tier = authority.tier;

  if (score < 0.45) {
    tier = "low_confidence";
  } else if (score < 0.6 && tier === "established") {
    tier = "general";
  }

  const reasons = [
    authority.reason,
    temporal.reason,
    topical.reason,
  ];

  if (
    isGermanJurisdictionQuery(query) &&
    domain &&
    !domain.endsWith(".de") &&
    !domain.endsWith(".bund.de") &&
    !domain.includes("europa.eu")
  ) {
    reasons.push(
      "Source is not a German-domain or EU-domain source for a Germany-specific query."
    );
  }

  return {
    tier,
    score,
    authority_score: authority.score,
    temporal_fit_score: temporal.score,
    topical_fit_score: topical.score,
    reasons,
  };
}

export type RankedResearchSearchResult = ResearchSearchResult & {
  quality: AgentKnowledgeSourceQuality;
};

export function rankResearchResults(
  query: string,
  results: ResearchSearchResult[]
): RankedResearchSearchResult[] {
  return results
    .map((result, index) => ({
      result,
      index,
      quality: assessResearchSource(query, result),
    }))
    .sort((left, right) => {
      if (right.quality.score !== left.quality.score) {
        return right.quality.score - left.quality.score;
      }

      const rightProvider = right.result.score ?? 0;
      const leftProvider = left.result.score ?? 0;

      if (rightProvider !== leftProvider) {
        return rightProvider - leftProvider;
      }

      return left.index - right.index;
    })
    .map(({ result, quality }) => ({
      ...result,
      quality,
    }));
}

export function qualityLimitations(
  query: string,
  rankedResults: RankedResearchSearchResult[]
): string[] {
  const limitations: string[] = [];

  if (!rankedResults.length) {
    return ["No web sources were available for quality assessment."];
  }

  const authoritativeCount = rankedResults.filter(
    (result) => result.quality.tier === "authoritative"
  ).length;

  if (!authoritativeCount) {
    limitations.push(
      "No authoritative government, regulator or EU source was found in the returned results."
    );
  }

  if (
    TARGET_YEAR_PATTERN.test(query) &&
    rankedResults.some((result) => !result.published_date)
  ) {
    limitations.push(
      "At least one returned source lacks a publication date, so year-specific freshness cannot be fully verified."
    );
  }

  const averageScore =
    rankedResults.reduce(
      (sum, result) => sum + result.quality.score,
      0
    ) / rankedResults.length;

  if (averageScore < 0.6) {
    limitations.push(
      "Returned sources are mostly secondary or weakly attributable; treat the synthesis as provisional."
    );
  }

  return limitations;
}
