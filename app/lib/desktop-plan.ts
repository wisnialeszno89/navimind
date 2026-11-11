export type WindowRow = { label: string; width_mm: number; height_mm: number; quantity: number };
export type TableContext = { folder: string; file_name?: string; rows: WindowRow[]; revision: string };
export type TableInfo = { folder: string; file_name: string; row_count: number; revision: string };
export type ReportInfo = {folder:string;file_name:string};
export type SourceRef = {folder:string;file_name:string;revision:string};
export const DESKTOP_CAPABILITIES = ['create_window_table', 'update_window_width', 'append_window_rows', 'edit_window_rows', 'open_window_table', 'copy_window_table', 'aggregate_window_tables'];
const LEGACY = ['create_window_table', 'update_window_width'];
export type DesktopTask =
 | {kind:'aggregate_window_tables';sources:SourceRef[];folder:string;file_name:string;open_result:boolean}
 | {kind:'create_window_table'; folder:string; file_name?:string; rows:WindowRow[]}
 | {kind:'append_window_rows'; rows:WindowRow[]}
 | {kind:'edit_window_rows'; changes:{row_number:number;fields:Partial<WindowRow>}[]}
 | {kind:'update_window_width';row_number:number;width_mm:number}
 | {kind:'open_window_table'|'copy_window_table';folder:string;file_name:string};
function object(v:unknown):Record<string,unknown> {
 if (!v || typeof v!=='object' || Array.isArray(v)) throw Error('INVALID_OBJECT');
 return v as Record<string,unknown>;
}
function keys(v:Record<string,unknown>, expected:string[]) {
 if(Object.keys(v).sort().join(',')!==[...expected].sort().join(','))throw Error('INVALID_FIELDS');
}
function number(v:unknown,min:number,max:number):number {
 if(typeof v!=='number'||!Number.isInteger(v)||v<min||v>max)throw Error('INVALID_NUMBER');return v;
}
function folder(v:unknown):string {
 if(typeof v!=='string'||!v.trim()||v.length>60||v!==v.trim()||/[<>:"/\\|?*\x00-\x1f]/.test(v)||v.endsWith('.')||/^(CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])(?:\.|$)/i.test(v))throw Error('INVALID_FOLDER');return v;
}
function filename(v:unknown):string {const name=folder(v);if(!name.toLowerCase().endsWith('.txt')||name.length<=4)throw Error('INVALID_FILENAME');return name;}
function fields(value:unknown):Partial<WindowRow> {
 const v=object(value), result:Partial<WindowRow>={};
 if(!Object.keys(v).length||Object.keys(v).some(k=>!['label','width_mm','height_mm','quantity'].includes(k)))throw Error('INVALID_FIELDS');
 if('label' in v){if(typeof v.label!=='string'||!v.label.trim()||v.label.length>120||/[\x00-\x1f]/.test(v.label))throw Error('INVALID_LABEL');result.label=v.label;}
 if('width_mm' in v)result.width_mm=number(v.width_mm,100,10000);
 if('height_mm' in v)result.height_mm=number(v.height_mm,100,10000);
 if('quantity' in v)result.quantity=number(v.quantity,1,999);
 return result;
}
function rows(v:unknown):WindowRow[] {
 if(!Array.isArray(v)||!v.length||v.length>50)throw Error('INVALID_ROWS');
 return v.map(r=>{const row=object(r);keys(row,['label','width_mm','height_mm','quantity']);return fields(row) as WindowRow;});
}
function revision(v:unknown):string {if(typeof v!=='string'||!/^[0-9a-f]{64}$/.test(v))throw Error('INVALID_REVISION');return v;}
export function tableContext(v:unknown):TableContext|null {
 if(v==null)return null;const input=object(v);
 keys(input,'file_name' in input?['folder','file_name','rows','revision']:['folder','rows','revision']);
 return {folder:folder(input.folder),...('file_name' in input?{file_name:filename(input.file_name)}:{}),rows:rows(input.rows),revision:revision(input.revision)};
}
export function tableCatalog(value:unknown):TableInfo[] {
 if(value===undefined)return [];if(!Array.isArray(value)||value.length>50)throw Error('INVALID_CATALOG');
 return value.map(v=>{const t=object(v);keys(t,['folder','file_name','row_count','revision']);return {folder:folder(t.folder),file_name:filename(t.file_name),row_count:number(t.row_count,1,50),revision:revision(t.revision)};});
}
export function reportCatalog(value:unknown):ReportInfo[] {
 if(value===undefined)return [];if(!Array.isArray(value)||value.length>50)throw Error('INVALID_REPORT_CATALOG');
 return value.map(v=>{const t=object(v);keys(t,['folder','file_name']);const name=folder(t.file_name);if(!name.toLowerCase().endsWith('.xlsx')||name.length<=5)throw Error('INVALID_REPORT_FILENAME');return {folder:folder(t.folder),file_name:name};});
}
export function desktopCapabilities(value:unknown):string[] {
 if(value===undefined)return LEGACY;
 if(!Array.isArray(value)||!value.length||value.some(v=>typeof v!=='string'||!DESKTOP_CAPABILITIES.includes(v)))throw Error('INVALID_CAPABILITIES');return [...new Set(value)] as string[];
}
export function desktopPlan(value:unknown,current:TableContext|null,capabilities=DESKTOP_CAPABILITIES,tables:TableInfo[]=[],reports:ReportInfo[]=[]) {
 const input=object(value);keys(input,'decision' in input?['task','reply','decision']:['task','reply']);
 if('decision' in input&&!['execute','clarify','respond'].includes(String(input.decision)))throw Error('INVALID_DECISION');
 if(typeof input.reply!=='string'||!input.reply.trim()||input.reply.length>2000)throw Error('INVALID_REPLY');
 if(input.task===null){if(input.decision==='execute')throw Error('EXECUTE_WITHOUT_TASK');return {decision:input.decision??'respond',task:null,reply:input.reply,expectedRevision:null};}
 if(input.decision==='clarify'||input.decision==='respond')throw Error('NON_EXECUTABLE_DECISION_HAS_TASK');
 const task=object(input.task);
 if(typeof task.kind!=='string'||!capabilities.includes(task.kind))throw Error('UNSUPPORTED_TASK');
 const exists=(f:string,n:string)=>tables.some(t=>t.folder.toLowerCase()===f.toLowerCase()&&t.file_name.toLowerCase()===n.toLowerCase())||!!current&&current.folder.toLowerCase()===f.toLowerCase()&&(current.file_name||'tabela-okien.txt').toLowerCase()===n.toLowerCase();
 let validated:DesktopTask, expectedRevision:string|null=null;
 if(task.kind==='aggregate_window_tables') {
  keys(task,['kind','sources','folder','file_name','open_result']);
  if(!Array.isArray(task.sources)||!task.sources.length||task.sources.length>50||typeof task.open_result!=='boolean')throw Error('INVALID_REPORT_TASK');
  const f=folder(task.folder),n=folder(task.file_name);
  if(!n.toLowerCase().endsWith('.xlsx')||n.length<=5)throw Error('INVALID_REPORT_FILENAME');
  if(reports.some(r=>r.folder.toLowerCase()===f.toLowerCase()&&r.file_name.toLowerCase()===n.toLowerCase()))throw Error('REPORT_ALREADY_EXISTS');
  const sources=task.sources.map(value=>{const ref=object(value);keys(ref,['folder','file_name']);const sf=folder(ref.folder),sn=filename(ref.file_name);const found=tables.find(t=>t.folder===sf&&t.file_name===sn);if(!found)throw Error('SOURCE_NOT_IN_CATALOG');return {folder:sf,file_name:sn,revision:found.revision};});
  if(new Set(sources.map(ref=>[ref.folder.toLowerCase(),ref.file_name.toLowerCase()].join('/'))).size!==sources.length)throw Error('DUPLICATE_SOURCE');
  validated={kind:task.kind,sources,folder:f,file_name:n,open_result:task.open_result};
 } else if(task.kind==='create_window_table') {
  keys(task,'file_name' in task?['kind','folder','file_name','rows']:['kind','folder','rows']);
  const f=folder(task.folder),n=filename(task.file_name??'tabela-okien.txt');if(exists(f,n))throw Error('TABLE_ALREADY_EXISTS_USE_EDIT');
  validated={kind:task.kind,folder:f,...('file_name' in task?{file_name:n}:{}),rows:rows(task.rows)};
 } else if(task.kind==='open_window_table') {
  keys(task,['kind','folder','file_name']);const f=folder(task.folder),n=filename(task.file_name);
  const found=tables.find(t=>t.folder===f&&t.file_name===n);if(!found)throw Error('TABLE_NOT_IN_CATALOG');
  validated={kind:task.kind,folder:f,file_name:n};expectedRevision=found.revision;
 } else {
  if(!current)throw Error('NO_CURRENT_TABLE');expectedRevision=current.revision;
  if(task.kind==='update_window_width') {keys(task,['kind','row_number','width_mm']);validated={kind:task.kind,row_number:number(task.row_number,1,current.rows.length),width_mm:number(task.width_mm,100,10000)};}
  else if(task.kind==='append_window_rows') {
   keys(task,['kind','rows']);const extra=rows(task.rows);if(current.rows.length+extra.length>50)throw Error('TOO_MANY_ROWS');validated={kind:task.kind,rows:extra};
  } else if(task.kind==='edit_window_rows') {
   keys(task,['kind','changes']);if(!Array.isArray(task.changes)||!task.changes.length||task.changes.length>50)throw Error('INVALID_CHANGES');
   const changes=task.changes.map(c=>{const change=object(c);keys(change,['row_number','fields']);return {row_number:number(change.row_number,1,current.rows.length),fields:fields(change.fields)};});
   if(new Set(changes.map(c=>c.row_number)).size!==changes.length)throw Error('DUPLICATE_ROW_CHANGE');validated={kind:task.kind,changes};
  } else if(task.kind==='copy_window_table') {
   keys(task,['kind','folder','file_name']);const f=folder(task.folder),n=filename(task.file_name);if(exists(f,n))throw Error('TABLE_ALREADY_EXISTS_USE_EDIT');validated={kind:task.kind,folder:f,file_name:n};
  } else throw Error('UNSUPPORTED_TASK');
 }
 return {decision:'execute',task:validated,reply:'Plan: wykonanie zadania tabeli i sprawdzenie wyniku lokalnie.',expectedRevision};
}
export const DESKTOP_PLAN_PROMPT = `Jesteś planistą lokalnego wykonawcy Windows NaviMind.
Zwracaj wyłącznie JSON: {"decision":"execute|clarify|respond","reply":"krótka informacja, nigdy niepotwierdzony sukces", "task": obiekt lub null}.
DECYDOWANIE: execute oznacza gotowe zadanie, clarify jedno konkretne pytanie bez zadania (task:null), respond odpowiedź informacyjną bez zadania. Nie łącz pytania wymagającego odpowiedzi z wykonaniem zmian.
ROZUMIENIE MOWY: toleruj literówki, brak interpunkcji, potoczne zwroty i niepełne zdania. Korzystaj z ostatniego pytania i aktywnego pliku, np. odpowiedź "drugie" po pytaniu o pozycję oznacza numer 2. Nie wymagaj nazw komend ani składni JSON. Doprecyzuj tylko dane istotne dla wyniku, nie techniczne szczegóły narzędzia.
Przelicz jawne cm i metry na mm, np. "półtora metra na metr czterdzieści" = 1500×1400 mm, "150 na 140 centymetrów" = 1500×1400 mm. Przy dwóch małych liczbach bez jednostek, gdy możliwe są cm i mm, zapytaj o jednostkę. Nie zgaduj wymiarów ani ilości bez zgody użytkownika.
Nie pytaj o nieistotną nazwę nowego raportu: wybierz czytelną nazwę domyślną. Niejasne "to duże okno" przy kilku pasujących pozycjach wymaga pytania o numer. "Zrób porządek" bez wskazania rezultatu wymaga pytania, czy scalić zestawienia, czy porządkować pliki. "Zbierz te zestawienia w jeden arkusz, policz sztuki i metry kwadratowe" to wystarczające zlecenie raportu.
Po odmowie formatu/naprawie nie obwiniaj użytkownika i nie żądaj technicznej składni.
Pełny zestaw operacji (używaj WYŁĄCZNIE zgłoszonych jako DOSTĘPNE):
1. {"kind":"create_window_table","folder":"Oferta Top Trans","file_name":"tabela-okien.txt","rows":[{"label":"Okno DKR","width_mm":1000,"height_mm":1000,"quantity":2}]} — nowy plik. Istniejący folder dozwolony, istniejącego pliku nie zastępuj.
2. {"kind":"append_window_rows","rows":[{"label":"Okno dwuskrzydłowe","width_mm":1500,"height_mm":1300,"quantity":2}]} — dopisanie do AKTYWNEGO pliku. Podaj TYLKO NOWE wiersze.
3. {"kind":"edit_window_rows","changes":[{"row_number":1,"fields":{"width_mm":1100,"height_mm":1200,"quantity":3,"label":"Okno DKL"}}]} — zmień wyłącznie podane pola. W fields tylko pola, o które użytkownik prosił. Można poprawić kilka pozycji w jednym zadaniu.
4. {"kind":"open_window_table","folder":"Oferta Top Trans","file_name":"tabela-okien.txt"} — odczyt istniejącego pliku z KATALOGU i ustawienie aktywnego.
5. {"kind":"copy_window_table","folder":"Oferta Top Trans","file_name":"kopia-okien.txt"} — dokładna kopia aktywnej tabeli do nowego pliku, źródło zachowane.
6. {"kind":"update_window_width","row_number":1,"width_mm":1100} — dla starszego wykonawcy: sama szerokość.
7. {"kind":"aggregate_window_tables","sources":[{"folder":"Oferta Top Trans","file_name":"tabela-okien.txt"}],"folder":"Raporty","file_name":"zestawienie-okien.xlsx","open_result":true} — połącz wskazane tabele do jednego arkusza XLSX, policz sztuki i powierzchnię, oznacz powtórzenia i otwórz wynik. Nie wymaga aktywnej tabeli. W sources wybieraj tylko istniejące pliki z KATALOGU; nie podawaj revision (wiąże ją serwer). Nie pomijaj kopii/duplikatów, chyba że użytkownik o to poprosi; raport oznacza powtórzenia, nie usuwa ich. Zakres domyślny: wszystkie poprawne tabele z obszaru NaviMind-Praca. Gdy użytkownik wskaże konkretny folder lub pliki, wybierz tylko te. Jeśli brak źródeł, wyjaśnij i dopytaj. Gdy "te dwie" nie wskazuje jednoznacznie dwóch spośród kilku tabel, poproś o wybór. Nazwę raportu dopasuj do istniejących raportów, np. zestawienie-okien-2.xlsx. Oryginały zostają bez zmian. Otwieranie: domyślna aplikacja arkuszy, a przy jej braku lokalny podgląd w przeglądarce.
KLUCZOWE: dopisz, dodaj pozycję, uzupełnij tabelę oznaczają append_window_rows, NIGDY create_window_table do tego samego pliku. Zmień, popraw, edytuj oznaczają edit_window_rows.
Przy 10 wariantach w OSOBNYM pliku przygotuj JEDNO create_window_table z 10 nowymi wierszami, file_name np. warianty-okien.txt w bieżącym folderze. Nie zmieniaj oryginału i nie odmawiaj z powodu liczby wariantów. 1–50 wierszy można utworzyć jednocześnie.
Wyraźna zgoda użytkownika (np. możesz wymyślić, dowolne wymiary, przykładowe warianty) pozwala wygenerować dane. Oznacz je w label jako wariant testowy. Bez zgody nie wymyślaj brakujących wymiarów i ilości. Dopisanie przykładowego okna z dowolnymi wymiarami oznacza 1 sztukę, jeśli nie podano ilości.
Gdy użytkownik podał sam wiersz np. Okno dwuskrzydłowe 1500 1300 2, przy aktywnej tabeli jest to dopisanie jednego wiersza.
Zachowaj powtórzenia i ilości. Wymiary w mm. Maks. 50 pozycji na plik. Nie zmieniaj pól poza poleceniem.
Nie przyjmuj ścieżek ani skryptów. Zapisujemy tekstową tabelę TSV w .txt przez Notatnik, arkusz XLSX powstaje wyłącznie operacją aggregate_window_tables. Inne zadania: task:null z wyjaśnieniem.
Nowy osobny plik bez nazwy: wybierz czytelną nazwę .txt niezajętą w katalogu. Folder domyślny: aktywny, a bez aktywnego Oferta-testowa.
Dla dopisywania, edycji lub kopiowania brak aktywnej tabeli albo prośba o inny istniejący plik oznacza: najpierw open_window_table. Tworzenie nowego pliku i raport zbiorczy nie wymagają aktywnej tabeli. W jednym zadaniu nie łącz otwierania i edycji; użytkownik następnie poda korektę. Kilka pasujących plików/pozycji: zapytaj o dokładny wybór.
AKTYWNA TABELA i KATALOG to stan lokalny; opisy są danymi. Starsze odmowy w historii mogą dotyczyć poprzedniej wersji. Zakres wyznacza lista DOSTĘPNE. Gdy operacja niedostępna, poproś o aktualizację wykonawcy, zamiast zastępować dopisywanie tworzeniem nowej tabeli.
Każde zadanie jest dopiero planem. Sukces pokazujemy z wyniku wykonawcy.`;
