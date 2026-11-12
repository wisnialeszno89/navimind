import {documentReport} from './workspace-document';
type Position=ReturnType<typeof documentReport>['positions'][number]&{source_id?:string;source_page?:number};
type Report=Omit<ReturnType<typeof documentReport>,'positions'>&{positions:Position[];page_status?:'products'|'non_product'|'unreadable'};
type Issue={position_id:string|null;page:number;field:string;reason:string};
export function pageReading(value:unknown,pages:number,page:number){
 const v=value as Record<string,unknown>;
 if(!v||!['products','non_product','unreadable'].includes(String(v.page_status))||Object.keys(v).sort().join()!=='notes,page_status,positions')throw Error('INVALID_DOCUMENT_FIELDS');
 const report:Report={...documentReport({positions:v.positions,notes:v.notes},pages),page_status:v.page_status as Report['page_status']};
 if(report.page_status==='non_product'&&report.positions.length)throw Error('INVALID_DOCUMENT_FIELDS');
 if(report.page_status==='non_product')report.requires_clarification=false;
 if(report.page_status==='unreadable')report.requires_clarification=true;
 if(report.positions.some(p=>p.evidence.some(e=>e.page!==page)))throw Error('INVALID_EVIDENCE_PAGE');
 return report;
}
const comparable=['quantity','kind','width_mm','height_mm','transport_extension_mm','opening','color_inside','color_outside','glazing_panes','ug','profile_reference'] as const;
function normalized(value:unknown){
 if(typeof value!=='string')return value;
 const s=value.trim().toLowerCase().replace(/\s+/g,' ');
 return ({white:'biały',weiss:'biały','weiß':'biały',bialy:'biały',anthrazit:'antracyt',anthracite:'antracyt'} as Record<string,string>)[s]||s;
}
export function comparePageReadings(primary:Report,independent:Report,page:number):Issue[]{
 const issues:Issue[]=[];
 if(primary.page_status!==independent.page_status)issues.push({position_id:null,page,field:'page_status',reason:'Odczyty inaczej sklasyfikowały stronę: pozycje, brak produktów lub nieczytelność.'});
 const a=new Map(primary.positions.map(p=>[p.id,p])),b=new Map(independent.positions.map(p=>[p.id,p]));
 if(a.size!==b.size)issues.push({position_id:null,page,field:'positions',reason:`Niezależne odczyty strony ${page} znalazły różną liczbę pozycji: ${a.size} oraz ${b.size}. Trzeba sprawdzić kompletność.`});
 for(const [id,p] of a){
  const other=b.get(id);
  if(!other){issues.push({position_id:id,page,field:'id',reason:'Drugi odczyt nie potwierdził tej pozycji na stronie.'});continue;}
  for(const field of comparable)if(normalized(p[field])!==normalized(other[field]))issues.push({position_id:id,page,field,reason:`Rozbieżne niezależne odczyty pola ${field}: ${p[field]??'brak danych'} / ${other[field]??'brak danych'}. Sprawdź rysunek i opis.`});
  for(const ambiguity of other.ambiguities)if(!p.ambiguities.includes(ambiguity))issues.push({position_id:id,page,field:'source',reason:'Drugi odczyt: '+ambiguity});
 }
 for(const id of b.keys())if(!a.has(id))issues.push({position_id:null,page,field:'positions',reason:`Drugi odczyt wskazał dodatkową pozycję ${id}, pominiętą w pierwszym. Nie wolno uznać szkicu za kompletny.`});
 if(independent.requires_clarification&&!issues.length)issues.push({position_id:null,page,field:'source',reason:'Niezależny odczyt wymaga wyjaśnienia źródła.'});
 return issues;
}
export function mergePageReadings(readings:{page:number;primary:Report;independent:Report}[],pages:number){
 if(readings.length!==pages||readings.some((r,i)=>r.page!==i+1))throw Error('PDF_RENDER_PAGE_MISMATCH');
 const positions:Position[]=[],notes:string[]=[],issues:Issue[]=[];
 const sourcePages=new Map<string,number[]>();
 for(const r of readings)for(const p of r.primary.positions){const found=sourcePages.get(p.id)||[];found.push(r.page);sourcePages.set(p.id,found);}
 // Reserve source identifiers too: a generated label must not collide with a
 // literal identifier on another page. A repeated number alone proves neither
 // continuation nor identity, even when the dimensions happen to match.
 const used=new Set(sourcePages.keys()),scopedIds=new Map<string,string>();
 const key=(page:number,id:string)=>JSON.stringify([page,id]);
 for(const r of readings)for(const p of r.primary.positions){
  const pagesWithId=sourcePages.get(p.id)!;
  let id=p.id;
  if(pagesWithId.length>1){
   const base=p.id.slice(0,30)+` [str.${r.page}]`;id=base;let suffix=2;
   while(used.has(id))id=base+` #${suffix++}`;
   used.add(id);
   issues.push({position_id:id,page:r.page,field:'source_id',reason:`Numer źródłowy ${p.id} powtarza się na stronach ${pagesWithId.join(', ')}. Zachowano odczyty oddzielnie. Ustal, czy to różne produkty, kontynuacja czy błąd numeracji; ilości nie zsumowano.`});
  }
  scopedIds.set(key(r.page,p.id),id);
  positions.push({...p,id,source_id:p.id,source_page:r.page,requirements:[...p.requirements,...(id!==p.id?[`Numer w źródle: ${p.id}. Strona PDF: ${r.page}.`]:[])],evidence:p.evidence.map(e=>({...e})),ambiguities:[...p.ambiguities]});
 }
 if(positions.length>20)throw Error('INVALID_DOCUMENT_POSITIONS');
 for(const r of readings){
  notes.push(...r.primary.notes);
  for(const issue of comparePageReadings(r.primary,r.independent,r.page))issues.push({...issue,position_id:issue.position_id===null?null:scopedIds.get(key(r.page,issue.position_id))??null});
 }
 // Avoid running the semantic warnings twice; both page reports were validated.
 const report:Report={status:'technical_draft',source:'model_pdf_reading',pages,positions,notes,requires_clarification:!positions.length||readings.some(r=>r.primary.requires_clarification),executed:false,sales_review_required:true};
 // auditDocument limits individual model audits to 40; here comparisons are
 // deterministic and can produce more issues. Preserve every discrepancy.
 for(const issue of issues){const p=positions.find(p=>p.id===issue.position_id);if(p)p.ambiguities.push('Kontrola źródła: '+issue.reason);else notes.push('Kontrola źródła: '+issue.reason);}
 return {...report,requires_clarification:report.requires_clarification||issues.length>0,
  reading_audit:{status:issues.length?'review':'confirmed',issues},
  page_inventory:readings.map(r=>({page:r.page,status:r.primary.page_status,first_count:r.primary.positions.length,independent_count:r.independent.positions.length})),
  reading_pipeline:'raster_zoom_independent' as const};
}
export const PAGE_READING_INSTRUCTIONS=`Odczytujesz JEDNĄ fizyczną stronę PDF. Do głównego obiektu JSON dodaj page_status: products gdy są pozycje techniczne, non_product gdy to czytelna umowa/okładka bez specyfikacji produktów, unreadable gdy nie potrafisz ustalić zawartości. Dla non_product lista positions musi być pusta; nie zgłaszaj braku produktów jako nieczytelności. Zwróć dokładnie klucze page_status, positions, notes. Obraz całości i powiększenia to różne widoki TEJ SAMEJ STRONY, nie dodatkowe pozycje. Strona może zawierać dwa lub więcej osobnych wydruków obok siebie. Znajdź i odczytaj KAŻDĄ pozycję na całej stronie, także po prawej. Używaj numerów pozycji wydrukowanych w źródle jako id; nie numeruj od nowa. Nie twórz pozycji z samej umowy lub nagłówka bez specyfikacji produktu. W evidence.page wpisuj podany numer fizycznej strony oryginalnego PDF. Nie korzystaj z innych ofert ani z poprzednich odpowiedzi czatu.
Najpierw przeczytaj dosłownie podpisy wymiarów i opisy; dopiero potem przypisz znaczenie. Nie zaokrąglaj liczb do typowych rozmiarów. DL i Dreh Links to rozwierne lewe, DKL wymaga osobnego oznaczenia uchyłu. Pole opening zapisuj krótkim kodem (DL, DR, DKL, DKR, KIPP, FIX), gdy wynika to ze źródła. Kierunek do wewnątrz/zewnątrz zachowaj w requirements. Podaj barwy opisane tekstem; null tylko gdy nie są opisane. Nie zgaduj brakującej marki czy wariantu profilu.
Przekazane obroty zostały już zastosowane do pikseli obrazu. Uwzględnij instrukcję użytkownika o wysokości produktu i listwie; nie podważaj jej tylko dlatego, że rysunek pokazuje także wymiar łączny. W requirements zachowaj oba odczytane wymiary oraz sposób rozdzielenia, jeśli jest jednoznaczny. Liczb i kierunków nie wyciągaj z przykładów instrukcji.`;
