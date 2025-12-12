export default function MessageBubble({
  role,
  content,
}: {
  role: string;
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
          background: isUser ? "#0077cc" : "rgba(255,255,255,0.1)",
          padding: "10px 14px",
          borderRadius: 12,
          maxWidth: "85%",
        }}
      >
        {content}
      </div>
    </div>
  );
}