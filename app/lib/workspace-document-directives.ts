import type {mergePageReadings} from './workspace-document-pages';
type Report=ReturnType<typeof mergePageReadings>;
type Correction={position_id:string;field:'width_mm'|'height_mm'|'transport_extension_mm';value:number;quote:string};
const normalize=(s:string)=>s.replace(/\s+/g,' ').trim();
const identifier=(s:string)=>/^\d+(?:\.0+)?$/.test(s)?String(Number(s)):s.trim();
export function needsMeasurementDirectives(text:string){return /\d/.test(text)&&/mm|wysoko|szeroko|listw|transport|height|width|Höhe|Breite/i.test(text);}
export const MEASUREMENT_DIRECTIVE_PROMPT=`Odczytaj wyłącznie jawne korekty wymiarów przekazane przez użytkownika. Nie czytasz PDF i nie uzupełniasz danych z pamięci. Wyodrębnij numer POZYCJI W ŹRÓDLE, pole width_mm, height_mm lub transport_extension_mm, wartość całkowitą w mm i dosłowny cytat instrukcji. Cytat musi zawierać numer pozycji i wartość. Wartość transportowa to osobne pole, nie dodawaj jej do wysokości produktu. Nie zgaduj pozycji na podstawie kolejności rysunków, numeru strony lub podobieństwa wymiarów. Jeśli instrukcja nie wskazuje pozycji albo jest sprzeczna, opisz to w unresolved zamiast tworzyć korektę. Bez korekt zwróć pustą listę corrections. Zwróć dokładnie {"corrections":[{"position_id":"numer ze wskazówki","field":"height_mm","value":1000,"quote":"dosłowna instrukcja"}],"unresolved":[]}. Liczby w tym opisie to przykład struktury, nie dane użytkownika.`;
export const measurementDirectiveFormat={type:'json_schema' as const,json_schema:{name:'measurement_directives',strict:true,schema:{type:'object',additionalProperties:false,required:['corrections','unresolved'],properties:{corrections:{type:'array',maxItems:20,items:{type:'object',additionalProperties:false,required:['position_id','field','value','quote'],properties:{position_id:{type:'string',minLength:1,maxLength:50},field:{type:'string',enum:['width_mm','height_mm','transport_extension_mm']},value:{type:'integer',minimum:1,maximum:100000},quote:{type:'string',minLength:1,maxLength:500}}}},unresolved:{type:'array',maxItems:20,items:{type:'string',minLength:1,maxLength:500}}}}}};
export function applyMeasurementDirectives(report:Report,value:unknown,instruction:string){
 const v=value as {corrections:Correction[];unresolved:string[]};
 if(!v||Object.keys(v).sort().join()!=='corrections,unresolved'||!Array.isArray(v.corrections)||v.corrections.length>20||!Array.isArray(v.unresolved)||v.unresolved.length>20)throw Error('INVALID_USER_DIRECTIVES');
 const corrections=v.corrections.map(c=>{
  if(!c||Object.keys(c).sort().join()!=='field,position_id,quote,value'||typeof c.position_id!=='string'||!c.position_id.trim()||c.position_id.length>50||!['width_mm','height_mm','transport_extension_mm'].includes(c.field)||!Number.isInteger(c.value)||c.value<1||c.value>(c.field==='transport_extension_mm'?1000:100000)||typeof c.quote!=='string'||!c.quote.trim()||c.quote.length>500)throw Error('INVALID_USER_DIRECTIVES');
  const quote=normalize(c.quote),id=c.position_id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  if(!normalize(instruction).includes(quote)||!new RegExp(`(?:^|\\D)${c.value}(?:\\D|$)`).test(quote)||!new RegExp(`(?:pozycj[\\p{L}]*|position|pos[.]?)\\s*${id}(?![\\p{L}\\d])`,'iu').test(quote))throw Error('UNGROUNDED_USER_DIRECTIVES');
  return {...c,position_id:c.position_id.trim(),quote};
 });
 if(v.unresolved.some(s=>typeof s!=='string'||!s.trim()||s.length>500))throw Error('INVALID_USER_DIRECTIVES');
 const positions=report.positions.map(p=>({...p,requirements:[...p.requirements],ambiguities:[...p.ambiguities]})),notes=[...report.notes],applied:Record<string,unknown>[]=[];
 let review=report.requires_clarification;
 for(const reason of v.unresolved){notes.push('Instrukcja użytkownika do wyjaśnienia: '+reason);review=true;}
 for(const c of corrections){
  const matches=positions.filter(p=>identifier(p.source_id??p.id)===identifier(c.position_id));
  const peers=corrections.filter(other=>identifier(other.position_id)===identifier(c.position_id)&&other.field===c.field);
  if(matches.length!==1||peers.some(other=>other.value!==c.value)){notes.push(`Nie zastosowano korekty pola ${c.field} dla numeru ${c.position_id}: brak jednoznacznej pozycji lub sprzeczne wartości.`);review=true;continue;}
  const p=matches[0],before=p[c.field];p[c.field]=c.value;
  if(!applied.some(a=>a.position_id===p.id&&a.field===c.field)){
   applied.push({position_id:p.id,source_id:p.source_id??p.id,field:c.field,before,value:c.value,quote:c.quote});
   p.requirements.push(`Korekta użytkownika, po odczycie źródła: ${c.field} = ${c.value} mm; odczyt źródłowy: ${before??'brak danych'} mm. Instrukcja: ${c.quote}`);
  }
 }
 return {...report,positions,notes,requires_clarification:review,user_corrections:applied};
}
