"use client";

import ReactMarkdown from "react-markdown";

export default function MessageBubble({
  role,
  content,
}: {
  role: "user" | "assistant" | "system";
  content: string;
}) {
  const isUser = role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          background: isUser ? "#0077cc" : "rgba(255,255,255,0.12)",
          color: isUser ? "#fff" : "#eaeaea",
          padding: "12px 16px",
          borderRadius: 14,
          maxWidth: "85%",
          lineHeight: 1.55,
          boxShadow: isUser
            ? "0 6px 18px rgba(0,0,0,0.25)"
            : "0 4px 12px rgba(0,0,0,0.2)",
        }}
      >
        <ReactMarkdown
          components={{
            strong(props) {
              return (
                <strong style={{ color: "#ffffff" }}>
                  {props.children}
                </strong>
              );
            },
            li(props) {
              return (
                <li style={{ marginBottom: 6 }}>
                  {props.children}
                </li>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}