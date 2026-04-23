"use client";

import ReactMarkdown from "react-markdown";

export default function MessageBubble({
  role,
  content,
  highlight,
  }: {
  role: "user" | "assistant" | "system";
  content: string;
  highlight?: string | null;
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
        <div className="text-sm opacity-60 italic mb-2">
          {highlight}
        </div>
      )}

      <ReactMarkdown
        components={{
          img({ src, alt }) {
            return (
              <img
                src={src || ""}
                alt={alt || "image"}
                className="max-w-full rounded-xl mb-2"
              />
            );
          },
          p({ children }) {
            return <p className="mb-2 last:mb-0">{children}</p>;
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
            return <strong className="font-semibold">{children}</strong>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  </div>
);
}