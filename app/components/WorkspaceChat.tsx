"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {runNativeCommand} from "@/lib/native-runner";
import MicrophoneButton from "./MicrophoneButton";
import type {NativeSnapshot} from "@/lib/native-plan";
import type { BrowserSnapshot } from "@/lib/browser-plan";
import type { TableContext, TableInfo, ReportInfo } from "@/lib/desktop-plan";
import { cleanPairingCode, localRequest, pairingCode } from "@/lib/desktop-connection";

type Message = { role: "user" | "assistant"; content: string; image?: string; documentName?:string };
type AgentStatus = { status: string; protocol: number; capabilities?: string[]; tables?: TableInfo[]; reports?: ReportInfo[]; warning?: string | null; browser?: {available:boolean;scope:string}; paint?: {available:boolean;method:string}; native?: {available:boolean;scope:string;title:string}; currentTable: (TableContext & { file: string }) | null };
type TaskResult = { specification?: {content:string;readback_verified:boolean;sha256:string}; status: "verified" | "review"; message: string; browser_export?: {image_file:string;report_file:string;goal_verified:boolean;price_verified:boolean;screenshot_scope:string}; native?: NativeSnapshot; system_report?: any; native_result?: {saved_pixels_changed:boolean;goal_verified:boolean}; drawing?: {width_mm:number;height_mm:number;construction:string;frame_color:string;method:string}; browser?: BrowserSnapshot; code?: string; file?: string; preview?: string; summary?: {files:number;positions:number;quantity:number;area_m2:string;duplicate_rows:number;duplicate_groups:number}; rows?: { label: string; width_mm: number; height_mm: number; quantity: number }[] };
function resultText(result: TaskResult) {
  if (result.status !== "verified") return "**Zadanie wymaga sprawdzenia.** " + result.message + (result.file ? "\n\nPlik: " + result.file : "");
  if(result.specification)return `**Specyfikacja zapisana i ponownie odczytana.** ${result.message}\n\nPlik: ${result.file}\n\nKontrola obejmuje zgodność całego zapisanego tekstu z przygotowaną treścią. Nie jest ponowną kontrolą źródłowego PDF.\n\n${result.specification.content}`;
  if(result.browser_export)return `**Widok zapisany na Pulpicie.** ${result.message}\n\nZrzut PNG: ${result.browser_export.image_file}\n\nRaport JSON: ${result.browser_export.report_file}\n\nZapis obejmuje aktualny widok. Cena i zgodność całej oferty nie zostały niezależnie potwierdzone.`;
  if(result.native)return "**Krok w aplikacji odczytany.** "+result.message+" Sprawdź okno Painta i podaj dalsze polecenie; całego zadania nie wznowiono automatycznie.";
  if(result.native_result)return `**Zapis pliku potwierdzony.** ${result.message}\n\nPlik: ${result.file}\n\nZmianę pikseli sprawdzono lokalnie. Zgodność rysunku z poleceniem wymaga oceny wizualnej.`;
  if(result.system_report){const f=result.system_report;const gb=(n:number)=>typeof n==='number'?(n/1073741824).toFixed(1)+' GiB':'brak pomiaru';return `**Raport komputera zapisany.** ${result.message}\n\nPlik: ${result.file}\n\n| Pomiar | Wynik |\n|---|---|\n| System | ${f.os.system} ${f.os.release}, ${f.os.version} |\n| Architektura | ${f.os.architecture} |\n| Logiczne procesory | ${f.cpu.logical_processors} |\n| RAM razem | ${gb(f.memory?.total_bytes)} |\n| RAM dostępny | ${gb(f.memory?.available_bytes)} |\n| Dysk razem | ${gb(f.system_disk.total_bytes)} |\n| Dysk wolny | ${gb(f.system_disk.free_bytes)} |\n\nTo odczyt faktów. Przyczyna problemu nie została jeszcze ustalona; ustawienia pozostają bez zmian.`;}
  if (result.drawing) {
    const drawing=result.drawing;
    const construction:Record<string,string>={single_dkl:'Jednoskrzydłowe DKL',single_dkr:'Jednoskrzydłowe DKR',double_fixed:'Dwa skrzydła, stały słupek, lewe DKL / prawe DKR'};
    return `**Schemat zapisany i otwarty w Paint.** ${result.message}\n\nPlik: ${result.file}\n\n${drawing.width_mm} × ${drawing.height_mm} mm · ${construction[drawing.construction]||drawing.construction} · kolor: ${drawing.frame_color}.\n\nSchemat poglądowy od wewnątrz. Przygotowano PNG z opisu i otwarto w nowym oknie Painta.`;
  }
  if (result.browser) return "**Krok w przeglądarce wykonany.** " + result.message;
  if (result.summary) {
    const summary = result.summary;
    return `**Arkusz zapisany i sprawdzony.** ${result.message}\n\nPlik: ${result.file}\n\nPodgląd: ${result.preview}\n\n| Wynik | Wartość |\n|---|---:|\n| Pliki źródłowe | ${summary.files} |\n| Pozycje | ${summary.positions} |\n| Sztuki | ${summary.quantity} |\n| Powierzchnia [m²] | ${summary.area_m2} |\n| Wiersze z powtórzeniem | ${summary.duplicate_rows} |\n| Grupy powtórzeń | ${summary.duplicate_groups} |\n\nPowtórzenia oznaczono bez usuwania. Sumy obejmują wszystkie wybrane źródła.`;
  }
  const rows = result.rows || [];
  return `**Wykonano i sprawdzono plik.** ${result.message}\n\nPlik: ${result.file}\n\n` +
    "| Pozycja | Opis | Szerokość [mm] | Wysokość [mm] | Sztuki |\n|---|---|---:|---:|---:|\n" +
    rows.map((row, index) => `| ${index + 1} | ${row.label.replace(/\|/g, "\\|")} | ${row.width_mm} | ${row.height_mm} | ${row.quantity} |`).join("\n");
}

export default function WorkspaceChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [pdf, setPDF] = useState<{data:string;name:string}|null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const imageGeneration = useRef(0);
  const [pairing, setPairing] = useState(false);
  const [pairingError, setPairingError] = useState("");
  const [code, setCode] = useState("");
  const [showPairingCode, setShowPairingCode] = useState(false);
  const codeLength = cleanPairingCode(code).length;
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [desktopMode, setDesktopMode] = useState(false);
  const [browserMode, setBrowserMode] = useState(false);
  const [nativeMode, setNativeMode] = useState(false);
  const [browserProgress, setBrowserProgress] = useState("");
  const stopBrowser = useRef(false);
  const [agent, setAgent] = useState<AgentStatus | null>(null);
  const [pendingJob, setPendingJob] = useState<string | null>(null);
  const tokenRef = useRef("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sendingRef = useRef(false);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  async function connect() {
    if (connecting) return;
    setConnecting(true);
    setPairingError("");
    try {
      const token = pairingCode(code);
      const status: AgentStatus = await localRequest(token, "/status");
      if (status.status !== "ready" || status.protocol !== 1) throw new Error("Zaktualizuj lokalnego wykonawcę.");
      tokenRef.current = token;
      setAgent(status);
      setConnected(true);
      setDesktopMode(true);
      setCode("");
      setShowPairingCode(false);
      setPairing(false);
    } catch (problem) {
      setPairingError(problem instanceof Error ? problem.message : "Błąd połączenia z lokalnym wykonawcą.");
    } finally { setConnecting(false); }
  }

  function disconnect() {
    tokenRef.current = "";
    setConnected(false);
    setDesktopMode(false);
    setBrowserMode(false);
    setNativeMode(false);
    setAgent(null);
  }

  async function recover() {
    if (!pendingJob || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setError("");
    try {
      const result: TaskResult = await localRequest(tokenRef.current, "/result/" + pendingJob);
      setMessages(previous => [...previous, { role: "assistant", content: resultText(result) }]);
      setPendingJob(null);
      setAgent(await localRequest(tokenRef.current, "/status"));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Brak potwierdzenia. Nie ponawiaj zadania automatycznie.");
    } finally { sendingRef.current = false; setSending(false); }
  }

  async function attachImage(file: File) {
    if (sendingRef.current || pendingJob) return;
    const generation = ++imageGeneration.current;
    setImageBusy(true);
    setImage(null);
    setImageName("");
    setPDF(null);
    setError("");
    try {
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024 || !file.size) throw new Error("Wybierz PNG, JPG lub WebP do 2 MB. Duży zrzut możesz zapisać jako JPG.");
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Nie udało się odczytać zrzutu."));
        reader.onerror = () => reject(new Error("Nie udało się odczytać zrzutu."));
        reader.readAsDataURL(file);
      });
      if (generation === imageGeneration.current) { setImage(data); setImageName(file.name || "Zrzut ekranu"); }
    } catch (problem) {
      if (generation === imageGeneration.current) setError(problem instanceof Error ? problem.message : "Nie udało się dodać zrzutu.");
    } finally { if (generation === imageGeneration.current) setImageBusy(false); }
  }

  async function attachPDF(file:File){
    if(sendingRef.current||pendingJob)return;
    const generation=++imageGeneration.current;
    setImageBusy(true);setImage(null);setImageName("");setPDF(null);setError("");
    try{
      if((file.type!=="application/pdf"&&!file.name.toLowerCase().endsWith(".pdf"))||!file.size||file.size>2*1024*1024)throw Error("Wybierz PDF do 2 MB i 10 stron, bez hasła.");
      const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>typeof reader.result==='string'?resolve(reader.result):reject(Error("Nie odczytano PDF."));reader.onerror=()=>reject(Error("Nie odczytano PDF."));reader.readAsDataURL(file);});
      if(generation===imageGeneration.current)setPDF({data:'data:application/pdf;base64,'+data.split(',')[1],name:file.name});
    }catch(problem){if(generation===imageGeneration.current)setError(problem instanceof Error?problem.message:"Nie odczytano PDF.");}
    finally{if(generation===imageGeneration.current)setImageBusy(false);}
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const content = text.trim() || (pdf ? "Odczytaj z PDF pozycje stolarki na podstawie rysunków i opisów. Wskaż niejasne wymiary i brakujące dane. Nie wykonuj działań w programie." : image ? "Pomóż zinterpretować ten zrzut i wskaż następny krok." : "");
    if (!content || sendingRef.current || pendingJob || imageBusy) return;
    sendingRef.current = true;
    setSending(true);
    setError("");
    const previousMessages = messages;
    const history = previousMessages.slice(-12).map(({role, content}) => ({role, content:content.length>8000?"Wcześniejszy odczyt dokumentu jest zbyt obszerny do historii. Nie zakładaj dostępności wszystkich pozycji. Poproś użytkownika o wskazanie konkretnej pozycji i parametrów przed wykonaniem.":content}));
    const desktopHistory = previousMessages.slice(-12).map(({role,content})=>({role,content:content.length<=48000?content:"Pełny wcześniejszy dokument nie mieści się w kontekście. Nie zapisuj skróconej specyfikacji jako pełnej; poproś o ponowny odczyt źródła."}));
    const attachedImage = image;
    const attachedName = imageName;
    const attachedPDF = pdf;
    if (attachedImage||attachedPDF) {setDesktopMode(false);setBrowserMode(false);setNativeMode(false);}
    setMessages(previous => [...previous, { role: "user", content, ...(attachedImage ? {image: attachedImage} : {}), ...(attachedPDF?{documentName:attachedPDF.name}:{}) }]);
    setText("");
    setPDF(null);
    setImage(null);
    setImageName("");
    let executionStarted = false;
    let browserActions = 0;
    stopBrowser.current = false;
    try {
      if(attachedPDF){
        setBrowserProgress("Sprawdzam orientację stron, odczytuję pozycje i porównuję wynik z PDF… To może potrwać około minuty.");
        const response=await fetch("/api/workspace/document-plan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:content,history,pdf:attachedPDF.data})});
        const result=await response.json();
        if(!response.ok)throw Error(result.message||"Nie udało się odczytać PDF.");
        setMessages(previous=>[...previous,{role:"assistant",content:result.reply}]);
      } else if(nativeMode&&!attachedImage){
        if(!connected||!tokenRef.current)throw Error("Najpierw połącz komputer.");
        const outcome=await runNativeCommand(tokenRef.current,content,history,{progress:setBrowserProgress,stopped:()=>stopBrowser.current,pending:(id)=>{setPendingJob(id);executionStarted=!!id;},executed:()=>{browserActions++;}});
        setMessages(previous=>[...previous,{role:"assistant",content:outcome.result?resultText(outcome.result)+"\n\nOcena modelu: "+outcome.reply:outcome.reply}]);
      } else if (browserMode && !attachedImage) {
        if (!connected || !tokenRef.current) throw new Error("Najpierw połącz komputer.");
        const status: AgentStatus = await localRequest(tokenRef.current, "/status");
        if (!status.browser?.available) throw new Error("Uruchom wykonawcę z --browser i połącz go ponownie, aby otworzyć okno Chromium NaviMind.");
        let snapshot: BrowserSnapshot = await localRequest(tokenRef.current, "/browser/observe");
        const steps: string[] = [JSON.stringify({observed_url:snapshot.url,source:"initial_observation"})];
        let staleRetries = 0;
        const noEffect = new Map<string,number>();
        const viewKey = (view: BrowserSnapshot) => JSON.stringify([view.url,view.text,view.controls.map(({ref,...control})=>control)]);
        for (let step = 0; step < 12; step++) {
          if (stopBrowser.current) break;
          setBrowserProgress(`Odczytuję stronę i planuję krok ${step+1}/12…`);
          const response = await fetch("/api/workspace/browser-plan", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:content,history,snapshot,steps})});
          const plan = await response.json();
          if (!response.ok) throw new Error(plan.message || "Nie udało się przygotować kroku przeglądarki.");
          if (stopBrowser.current) break;
          if (!plan.task) {
            setMessages(previous => [...previous,{role:"assistant",content:(plan.decision==='done'?"**Wynik pracy w przeglądarce.** ":"**Potrzebny kolejny krok.** ")+plan.reply+`\n\nOdczytana strona: ${snapshot.url}\n\nTytuł: ${snapshot.title}`}]);
            return;
          }
          const before=viewKey(snapshot);
          const target='ref' in plan.task?snapshot.controls.find(c=>c.ref===plan.task.ref)?.name:plan.task.url||plan.task.kind;
          const actionKey=JSON.stringify([before,plan.task.kind,target]);
          if ((noEffect.get(actionKey)||0)>=2) {
            setMessages(previous=>[...previous,{role:"assistant",content:"Zatrzymałem zadanie: dwie próby nie zmieniły widoku strony. Sprawdź aktualny stan w oknie Chromium NaviMind."}]);return;
          }
          setBrowserProgress(`Krok ${step+1}/12: ${plan.reply}`);
          const id=crypto.randomUUID();setPendingJob(id);executionStarted=true;
          const result:TaskResult=await localRequest(tokenRef.current,"/execute",{id,task:plan.task,expectedRevision:plan.expectedRevision});
          setPendingJob(null);executionStarted=false;
          steps.push(JSON.stringify({task:plan.task,result:result.message,status:result.status,observed_url:result.browser?.url}).slice(0,1000));
          if(result.code==='STALE_PAGE' && staleRetries<2 && !stopBrowser.current){
            staleRetries++;snapshot=await localRequest(tokenRef.current,"/browser/observe");continue;
          }
          if(result.status!=='verified'||!result.browser){
            setMessages(previous=>[...previous,{role:"assistant",content:resultText(result)+" Nowej próby nie wykonano automatycznie."}]);return;
          }
          browserActions++;
          if(result.browser_export){
            setMessages(previous=>[...previous,{role:"assistant",content:resultText(result)+`\n\nOdczytana strona: ${result.browser?.url}`}]);return;
          }
          snapshot=result.browser;
          if(plan.task.kind==='browser_click'&&viewKey(snapshot)===before)noEffect.set(actionKey,(noEffect.get(actionKey)||0)+1);
        }
        setMessages(previous=>[...previous,{role:"assistant",content:stopBrowser.current?"Zatrzymałem zadanie w przeglądarce. Wykonane kroki pozostają widoczne w oknie Chromium NaviMind.":"Zatrzymałem zadanie po 12 krokach. Sprawdź aktualny widok; nie uznaję całego zadania za zakończone."}]);
      } else if (desktopMode && !attachedImage) {
        if (!connected || !tokenRef.current) throw new Error("Najpierw połącz komputer.");
        const status: AgentStatus = await localRequest(tokenRef.current, "/status");
        if (status.status !== "ready" || status.protocol !== 1) throw new Error("Wykonawca nie jest gotowy.");
        setAgent(status);
        const currentTable = status.currentTable ? {
          folder: status.currentTable.folder, ...(status.currentTable.file_name ? {file_name: status.currentTable.file_name} : {}), rows: status.currentTable.rows, revision: status.currentTable.revision,
        } : null;
        const response = await fetch("/api/workspace/desktop-plan", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, history: desktopHistory, currentTable, capabilities: status.capabilities, tables: status.tables, reports: status.reports }),
        });
        const plan = await response.json();
        if (!response.ok) throw new Error(plan.message || "Nie udało się przygotować zadania.");
        if (!plan.task) {
          setMessages(previous => [...previous, { role: "assistant", content: plan.reply }]);
          return;
        }
        const id = crypto.randomUUID();
        setPendingJob(id);
        executionStarted = true;
        const result: TaskResult = await localRequest(tokenRef.current, "/execute", { id, task: plan.task, expectedRevision: plan.expectedRevision });
        setMessages(previous => [...previous, { role: "assistant", content: resultText(result) }]);
        setPendingJob(null);
        // The confirmed result above remains visible even if a later status read fails.
        try { setAgent(await localRequest(tokenRef.current, "/status")); } catch { setAgent(null); }
      } else {
        const response = await fetch("/api/workspace/chat", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, history, ...(attachedImage ? {image: attachedImage} : {}) }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Nie udało się wysłać wiadomości.");
        setMessages(previous => [...previous, { role: "assistant", content: result.reply }]);
      }
    } catch (problem) {
      if (executionStarted) {
        setMessages(previous => [...previous, { role: "assistant", content: "**Brak potwierdzenia wyniku.** Połączenie przerwano podczas wykonania. Kliknij „Sprawdź wynik zadania”; nie wysyłaj ponownie tego samego polecenia." }]);
      } else if (browserActions > 0) {
        setMessages(previous=>[...previous,{role:"assistant",content:`Przerwałem planowanie po ${browserActions} wykonanych krokach. Ich efekty pozostają w oknie zadania. Sprawdź aktualny widok i podaj dalsze polecenie.`}]);
        setError(problem instanceof Error ? problem.message : "Przerwano połączenie.");
      } else {
        setMessages(previousMessages);
        setText(content);
        setImage(attachedImage);
        setImageName(attachedName);
        setPDF(attachedPDF);
        setError(problem instanceof Error ? problem.message : "Błąd połączenia.");
      }
    } finally {
      sendingRef.current = false;
      setSending(false);
      setBrowserProgress("");
      inputRef.current?.focus();
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-4 py-5 text-slate-100">
      <header className="border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-semibold">NaviMind · przestrzeń pracy</h1>
        <p className="mt-2 text-sm text-slate-300">Oferty, dokumenty i zadania dla lokalnego agenta.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p role="status" className={`text-sm ${connected ? "text-emerald-300" : "text-amber-200"}`}>
            {connected ? "Komputer połączony w tej karcie" : "Komputer niepołączony — działa rozmowa"}
          </p>
          <button type="button" disabled={sending || connecting || !!pendingJob} onClick={() => connected ? disconnect() : setPairing(value => !value)} className="rounded border border-slate-500 px-3 py-1 disabled:opacity-50">
            {connected ? "Rozłącz" : "Połącz komputer"}
          </button>
          {connected && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={desktopMode} disabled={sending || !!pendingJob} onChange={event => {setDesktopMode(event.target.checked);if(event.target.checked){setBrowserMode(false);setNativeMode(false);}}} />Praca na komputerze</label>}
        </div>
        {connected && <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={browserMode} disabled={sending || !!pendingJob || !agent?.browser?.available} onChange={event=>{setBrowserMode(event.target.checked);if(event.target.checked){setDesktopMode(false);setNativeMode(false);}}} />Przeglądarka · Chromium NaviMind</label>}
        {connected && !agent?.browser?.available && <p className="mt-2 text-xs text-amber-200">Obsługa stron wymaga aktualnego wykonawcy uruchomionego z --browser.</p>}
        {connected && <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={nativeMode} disabled={sending||!!pendingJob||!agent?.native?.available} onChange={event=>{setNativeMode(event.target.checked);if(event.target.checked){setDesktopMode(false);setBrowserMode(false);}}}/>Aplikacja · Paint sterowany obrazem</label>}
        {nativeMode && <p className="mt-2 text-sm text-amber-100">Polecenie przełączy fokus na nowe okno Painta sesji. Zrzuty tego okna będą przesyłane do modelu po każdym kroku. Agent może klikać, przeciągać i wpisywać tekst. Zatrzymaj zadanie, aby przejąć sterowanie. Zapis potwierdza wykonawca; wygląd rysunku sprawdzamy wizualnie.</p>}
        {browserMode && <p className="mt-2 text-sm text-amber-100">Agent pracuje w osobnym oknie Chromium NaviMind. Po wysłaniu polecenia przekaże do modelu widoczny tekst i opisy elementów tej karty. Wartości pól, cookies i dane sesji nie są wysyłane do modelu. Logowanie oraz końcowe zatwierdzanie płatności, wysyłania i usuwania wykonujesz ręcznie.</p>}
        {pairing && <div className="mt-3 space-y-2 rounded-lg bg-slate-800 p-3">
          <p className="text-sm">Uruchom lokalnego wykonawcę w PowerShell. Wklej tutaj kod parowania z tego okna. Kod zostaje w tej karcie i służy wyłącznie do połączenia lokalnego.</p>
          <label htmlFor="pairing-code" className="block text-sm">Kod parowania</label>
          <div className="flex gap-2"><input id="pairing-code" type={showPairingCode ? "text" : "password"} spellCheck={false} autoCapitalize="none" autoComplete="off" value={code} onChange={event => { setCode(event.target.value); setPairingError(""); }} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void connect(); } }} aria-describedby="pairing-help" aria-invalid={!!pairingError} className="min-w-0 flex-1 rounded bg-slate-900 p-2" /><button type="button" aria-pressed={showPairingCode} aria-controls="pairing-code" onClick={() => setShowPairingCode(value => !value)} className="rounded border border-slate-500 px-3 py-2">{showPairingCode ? "Ukryj kod" : "Pokaż kod"}</button><button type="button" onClick={connect} disabled={connecting || !code.trim()} className="rounded bg-blue-600 px-3 py-2 disabled:opacity-50">{connecting ? "Sprawdzam połączenie…" : "Połącz"}</button></div>
          <p role="status" className="text-sm text-slate-200">Wklejono {codeLength} znaków kodu. Oczekiwane: 43.</p>
          <p id="pairing-help" className="text-xs text-slate-300">Kod musi pochodzić z wykonawcy uruchomionego na tym samym komputerze. Zostaw jego okno otwarte.</p>
          {connecting && <p role="status" className="text-sm text-blue-200">Łączę z lokalnym wykonawcą. Sprawdź pytanie przeglądarki o dostęp lokalny. Test odpowiedzi potrwa do 10 sekund.</p>}
          {pairingError && <p role="alert" className="rounded border border-red-400 bg-red-950 p-3 text-sm text-red-100">{pairingError}</p>}
        </div>}
        {connected && <p className="mt-2 text-xs text-slate-300">Tabele okien: edycja i osobne pliki. Raport XLSX: scalanie, sztuki, powierzchnia i powtórzenia. Pliki: Pulpit / NaviMind-Praca.{agent?.currentTable && ` Aktywny plik: ${agent.currentTable.folder} / ${agent.currentTable.file_name || "tabela-okien.txt"}.`}</p>}
        {connected && agent?.capabilities && !agent.capabilities.includes("append_window_rows") && <p className="mt-2 text-sm text-amber-200">Zaktualizuj lokalnego wykonawcę, aby dopisywać i edytować pozycje.</p>}
        {connected && agent?.capabilities && !agent.capabilities.includes("aggregate_window_tables") && <p className="mt-2 text-sm text-amber-200">Raport XLSX wymaga aktualizacji lokalnego wykonawcy.</p>}
        {connected && agent?.paint?.available && <p className="mt-2 text-xs text-slate-300">Paint: w trybie Praca na komputerze możesz zlecić schemat okna PNG i otwarcie go w nowym oknie Painta.</p>}
        {agent?.warning && <p role="alert" className="mt-2 text-sm text-amber-200">{agent.warning}</p>}
      </header>
      <section aria-label="Rozmowa" aria-live="polite" className="flex-1 space-y-4 py-6">
        {messages.length === 0 && <p className="text-slate-300">Napisz zadanie lub nagraj polecenie. Po nagraniu sprawdź tekst i naciśnij Wyślij.</p>}
        {messages.map((message, index) => (
          <article key={index} className={`rounded-xl p-4 ${message.role === "user" ? "ml-6 bg-blue-900" : "mr-6 bg-slate-800"}`}>
            <p className="mb-2 text-xs text-slate-300">{message.role === "user" ? "Ty" : "NaviMind"}</p>
            {message.documentName && <p className="mb-3 text-sm">Dokument PDF: {message.documentName}</p>}
            {message.image && <img src={message.image} alt="Zrzut dołączony do tej wiadomości" className="mb-3 max-h-80 max-w-full rounded border border-slate-500 object-contain" />}
            <div className="space-y-2 overflow-x-auto break-words"><ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown></div>
          </article>
        ))}
        {sending && <p role="status">{browserProgress || "NaviMind analizuje zadanie i przygotowuje wynik…"}</p>}
        {sending && (browserMode||nativeMode) && <button type="button" onClick={()=>{stopBrowser.current=true;setBrowserProgress("Zatrzymuję po bieżącym kroku…");}} className="rounded border border-amber-300 px-3 py-2">Zatrzymaj po bieżącym kroku</button>}
        {pendingJob && !sending && <button type="button" onClick={recover} className="rounded border border-amber-300 px-3 py-2">Sprawdź wynik zadania</button>}
        <div ref={bottomRef} />
      </section>
      <form onSubmit={send} className="sticky bottom-0 space-y-3 border-t border-slate-700 bg-slate-950 py-4">
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        <label htmlFor="workspace-command" className="block text-sm">{pdf ? "Wskazówki do odczytu PDF" : image ? "Pytanie do zrzutu ekranu" : nativeMode ? "Polecenie dla okna aplikacji" : browserMode ? "Polecenie dla przeglądarki" : desktopMode ? "Polecenie do wykonania na komputerze" : "Wiadomość"}</label>
        <textarea id="workspace-command" ref={inputRef} value={text} rows={3} maxLength={8000}
          disabled={sending || !!pendingJob} onChange={event => setText(event.target.value)}
          onPaste={event => { const file = Array.from(event.clipboardData.files).find(file => file.type.startsWith("image/")); if (file) { event.preventDefault(); void attachImage(file); } }}
          onKeyDown={event => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          className="w-full resize-y rounded-xl border border-slate-600 bg-slate-900 p-3"
          placeholder={nativeMode ? "W Paint narysuj dom, drzewo i słońce, dodaj napis NaviMind i zapisz rysunek." : browserMode ? "W formularzu wybierz Top Trans, ustaw 1100 × 1000 mm, antracyt i DKR. Pokaż podgląd." : desktopMode ? "Utwórz folder Oferta Top Trans i tabelę: 2 okna DKR 1000×1000 mm…" : "Napisz wiadomość…"} />
        <div className="space-y-2">
          <label className="inline-block cursor-pointer rounded border border-slate-500 px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-blue-400">
            {imageBusy ? "Wczytuję zrzut…" : "Dołącz zrzut ekranu"}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={sending || !!pendingJob || imageBusy}
              onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void attachImage(file); }} />
          </label>
          <label className="ml-2 inline-block cursor-pointer rounded border border-slate-500 px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-blue-400">
            Dołącz PDF zapytania
            <input type="file" accept="application/pdf,.pdf" className="sr-only" disabled={sending||!!pendingJob||imageBusy}
              onChange={event=>{const file=event.target.files?.[0];event.target.value="";if(file)void attachPDF(file);}}/>
          </label>
          {pdf&&<div className="rounded-lg border border-slate-600 p-3">
            <p className="text-sm">PDF: {pdf.name}</p>
            <p className="mt-1 text-xs text-amber-200">Do 2 MB i 10 stron. PDF, w tym rysunki i skany, zostanie przekazany do modelu do odczytu pozycji. Ta wiadomość nie uruchomi działań na komputerze. Wynik wymaga sprawdzenia.</p>
            <button type="button" disabled={sending} onClick={()=>{imageGeneration.current++;setPDF(null);}} className="mt-2 text-sm underline">Usuń PDF</button>
          </div>}
          <p className="text-xs text-slate-400">Możesz też wykonać zrzut przez Win+Shift+S i wkleić Ctrl+V w polu wiadomości. PNG, JPG, WebP, do 2 MB.</p>
          {image && <div className="rounded-lg border border-slate-600 p-3">
            <img src={image} alt="Zrzut przygotowany do wysłania" className="max-h-48 max-w-full rounded object-contain" />
            <p className="mt-2 text-xs">{imageName}</p>
            <p className="mt-1 text-xs text-amber-200">Po wysłaniu zrzut zostanie przekazany do modelu NaviMind do analizy. Ta wiadomość nie uruchomi działań na komputerze. Ukryj zbędne dane przed wysłaniem.</p>
            <button type="button" disabled={sending} onClick={() => { imageGeneration.current++; setImage(null); setImageName(""); }} className="mt-2 text-sm underline">Usuń zrzut</button>
          </div>}
        </div>
        <div className="flex items-start justify-between gap-3">
          <MicrophoneButton disabled={sending || !!pendingJob} onResult={transcript => setText(previous => [previous.trim(), transcript].filter(Boolean).join(" "))} />
          <button type="submit" disabled={sending || !!pendingJob || imageBusy || (!text.trim() && !image && !pdf)} className="rounded-lg bg-blue-600 px-5 py-2 disabled:opacity-50">{pdf ? "Odczytaj PDF" : image ? "Wyślij zrzut" : nativeMode ? "Wykonaj w aplikacji" : browserMode ? "Wykonaj w przeglądarce" : desktopMode ? "Wykonaj" : "Wyślij"}</button>
        </div>
        <p className="text-xs text-slate-400">Historia, zrzuty i parowanie działają w bieżącej karcie. Po odświeżeniu połącz komputer ponownie. Nagranie wysyłane jest do rozpoznania mowy po zatrzymaniu.</p>
      </form>
    </main>
  );
}
