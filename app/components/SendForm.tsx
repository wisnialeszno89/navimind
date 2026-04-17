"use client";

import { useState, useEffect, useRef } from "react";
import { useChatStore } from "../lib/chatStore";
import ProNotice from "./ProNotice";
import { Plus } from "lucide-react";
import { imageToBase64 } from "../lib/imageToBase64";
import BeforeAfterSlider from "./BeforeAfterSlider";
import ImageMaskEditor from "./ImageMaskEditor";

type HistoryItem = {
  id: string;
  name: string;
  type: string;
  preview?: string;
  result?: string;
  version: number;
};

export default function SendForm({ setIsTyping, chatId }: any) {
  const [text, setText] = useState("");
  const [showPro, setShowPro] = useState(false);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selected, setSelected] = useState<HistoryItem | null>(null);

  const [fileHistory, setFileHistory] = useState<
    { base64: string; type: string }[]
  >([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 🔥 KLUCZOWE
  const [activeFile, setActiveFile] = useState<{
    base64: string;
    type: string;
  } | null>(null);

  const [maskMode, setMaskMode] = useState(false);
  const [mask, setMask] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const add = useChatStore((s) => s.add);
  const plan = useChatStore((s) => s.plan);

  /* ================= LOAD PLAN ================= */

  useEffect(() => {
    fetch("/api/plan")
      .then((res) => res.json())
      .then((data) => {
        useChatStore.setState({ plan: data.plan });
      })
      .catch(() => {});
  }, []);

  /* ================= FILE SELECT ================= */

  function handleFile(file: File) {
    setPendingFile(file);

    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }

    add({
      role: "assistant",
      content: "✏️ Opisz co chcesz zrobić z plikiem",
    });
  }

  /* ================= SEND ================= */

  async function send() {
    const raw = text.trim();
    if (!raw) return;

    if (fileHistory.length > 0 && !pendingFile) {
      add({ role: "user", content: raw });
      await handleFileProcessFromMemory(raw);
      setText("");
      return;
    }

    if (pendingFile && plan === "free") {
      setShowPro(true);
      return;
    }

    setText("");

    if (pendingFile) {
      await processFile(pendingFile, raw);
      return;
    }

    add({ role: "user", content: raw });
  }

  /* ================= PROCESS FILE ================= */

  async function processFile(file: File, prompt: string) {
    add({ role: "assistant", content: "⏳ Przetwarzam..." });

    let base64 = "";

    if (file.type.startsWith("image/")) {
      base64 = await imageToBase64(file, 800, 0.8);
    } else {
      base64 = await fileToBase64(file);
    }

    setFileHistory([{ base64, type: file.type }]);
    setCurrentIndex(0);

    setActiveFile({
      base64,
      type: file.type,
    });

    const res = await fetch("/api/file-process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file: base64,
        type: file.type,
        prompt,
        mask,
      }),
    });

    const data = await res.json();

    if (data.error) {
      setShowPro(true);
      return;
    }

    handleResponse(data, file.name);

    setPendingFile(null);
    setPreviewUrl(null);
  }

  /* ================= PROCESS FROM MEMORY ================= */

  async function handleFileProcessFromMemory(prompt: string) {
    const current = fileHistory[currentIndex];
    if (!current) return;

    add({ role: "assistant", content: "⏳ Edytuję..." });

    const res = await fetch("/api/file-process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file: current.base64,
        type: current.type,
        prompt,
        mask,
      }),
    });

    const data = await res.json();

    if (data.error) {
      setShowPro(true);
      return;
    }

    handleResponse(data, "edit");
  }

  /* ================= HANDLE RESPONSE ================= */

  function handleResponse(data: any, name: string) {
    const id = crypto.randomUUID();

    const newItem: HistoryItem = {
      id,
      name,
      type: data.type,
      preview: previewUrl || undefined,
      result: data.data,
      version: getNextVersion(name),
    };

    setHistory((prev) => [newItem, ...prev]);
    setSelected(newItem);

    if (data.type === "image") {
      const newVersion = {
        base64: data.data,
        type: "image/png",
      };

      setFileHistory((prev) => [...prev, newVersion]);
      setCurrentIndex((prev) => prev + 1);

      setActiveFile(newVersion);

      const url = `data:image/png;base64,${data.data}`;

      add({
        role: "assistant",
        content: `
![img](${url})

⬇️ [Pobierz obraz](${url})

✨ Gotowe — możesz edytować dalej.
`,
      });
    }

    if (data.type === "pdf") {
      const url = `data:application/pdf;base64,${data.data}`;

      add({
        role: "assistant",
        content: `
📄 Gotowy dokument

⬇️ [Pobierz PDF](${url})
`,
      });
    }

    if (data.type === "text") {
      add({ role: "assistant", content: data.data });
    }
  }

  function getNextVersion(name: string) {
    const versions = history.filter((h) => h.name === name);
    return versions.length + 1;
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.readAsDataURL(file);
    });
  }

  function undo() {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }

  function resetToOriginal() {
    setCurrentIndex(0);
  }

  function pinVersion(index: number) {
    const pinned = fileHistory[index];
    if (!pinned) return;

    setFileHistory([pinned]);
    setCurrentIndex(0);

    add({
      role: "assistant",
      content: "📌 Ustawiono jako bazę",
    });
  }

  /* ================= UI ================= */

  return (
    <div className="border-t p-3 space-y-3">

      {/* HISTORIA */}
      {history.length > 0 && (
        <div className="text-xs opacity-80">
          Ostatnie:
          <div className="flex gap-2 mt-1 overflow-x-auto">
            {history.map((h, i) => (
              <div key={h.id} className="flex gap-1 items-center">
                <button
                  onClick={() => setSelected(h)}
                  className="px-2 py-1 bg-white/10 rounded"
                >
                  {h.name} v{h.version}
                </button>
                <button onClick={() => pinVersion(i)}>📌</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPARE */}
      {selected && selected.preview && selected.type === "image" && (
        <BeforeAfterSlider
          before={selected.preview}
          after={`data:image/png;base64,${selected.result}`}
        />
      )}

      {/* PREVIEW */}
      {previewUrl && (
        <img src={previewUrl} className="w-full max-w-md rounded" />
      )}

      {/* MASK EDIT */}
      {activeFile && maskMode && (
        <ImageMaskEditor
          image={`data:image/png;base64,${activeFile.base64}`}
          onMaskReady={(m) => {
            setMask(m);
            setMaskMode(false);
          }}
        />
      )}

      {/* ACTION BAR */}
      {activeFile && !maskMode && (
        <div className="flex gap-2 text-xs">
          <button onClick={() => setMaskMode(true)}>🎯</button>
          <button onClick={undo}>↩</button>
          <button onClick={resetToOriginal}>🔄</button>
        </div>
      )}

      {/* FORM */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2"
      >
        <button onClick={() => fileInputRef.current?.click()}>
          <Plus size={18} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 p-2 rounded bg-black/20"
        />

        <button type="submit">➤</button>
      </form>

      {showPro && <ProNotice onClose={() => setShowPro(false)} />}
    </div>
  );
}