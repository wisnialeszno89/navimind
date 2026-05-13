"use client";

import ReactMarkdown from "react-markdown";

function splitSections(text: string) {
  return text
    .split(/\n\s*\n/) // 🔥 lepszy split (łapie puste linie)
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractOptions(section: string) {

  // 🔥 jeśli są linki → NIE rób buttonów
  if (
    section.includes("http://") ||
    section.includes("https://") ||
    section.includes("](")
  ) {
    return [];
  }

  const lines = section.split("\n");

  return lines.filter(
    (l) =>
      /^\d+\./.test(l)
  );
}
// 🔥 wykrywanie nagłówków (emoji + tekst:)
function isHeader(section: string) {
  return /^(🔥|⚠️|👉|✔️)/.test(section.trim());
}

export default function MessageBubble({
  role,
  content,
  highlight,
  onSend,
}: {
  role: "user" | "assistant" | "system";
  content: string;
  highlight?: string | null;
  onSend?: (text: string) => void;
}) {
  const isUser = role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          max-w-[85%]
          rounded-2xl
          px-4 py-3
          text-[1.05rem] leading-7
          shadow-sm
          ${
            isUser
              ? "bg-blue-600 text-white"
              : "bg-white/10 text-white/90 backdrop-blur"
          }
        `}
      >
        {highlight && (
          <div className="text-sm opacity-60 italic mb-3">
            {highlight}
          </div>
        )}

        {/* 🔥 SEKCJE */}
        {splitSections(content).map((section, i) => {
          const isAction = section.includes("Zrób teraz");
          const isLinks = section.includes("http");
          const options = extractOptions(section);
          const header = isHeader(section);

          // 🔥 OPCJE → BUTTONY
          if (options.length > 0 && onSend) {
            return (
              <div key={i} className="flex flex-col gap-2 mb-4">
                {options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSend(opt.replace(/^\d+\.\s*/, ""))}
                    className="text-left p-2 rounded-lg border border-white/20 hover:bg-white/10 transition"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            );
          }

          return (
            <div
              key={i}
              className={`
                mb-4
                ${
                  header
                    ? "mt-2 mb-1 font-semibold text-white"
                    : "p-3 rounded-xl"
                }
                ${
                  isAction
                    ? "bg-blue-500/20 border border-blue-400"
                    : isLinks
                    ? "bg-white/5"
                    : ""
                }
              `}
            >
              <ReactMarkdown
                components={{
                  img({ src, alt }) {
                    return (
                      <img
                        src={src || ""}
                        alt={alt || "image"}
                        className="max-w-full rounded-xl mb-3"
                      />
                    );
                  },
                  a({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="
        text-blue-400
        underline
        break-all
        hover:text-blue-300
      "
    >
      {children}
    </a>
  );
},
                  p({ children }) {
                    return (
                      <p className="mb-2 last:mb-0 leading-relaxed">
                        {children}
                      </p>
                    );
                  },

                  ul({ children }) {
                    return (
                      <ul className="list-disc pl-5 mb-2 space-y-1">
                        {children}
                      </ul>
                    );
                  },

                  ol({ children }) {
                    return (
                      <ol className="list-decimal pl-5 mb-2 space-y-1">
                        {children}
                      </ol>
                    );
                  },

                  strong({ children }) {
                    return (
                      <strong className="font-semibold text-white">
                        {children}
                      </strong>
                    );
                  },
                }}
              >
                {section}
              </ReactMarkdown>

              </div>
          );
        })}
      </div>
    </div>
  );
}