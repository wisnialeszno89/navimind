import Ajv from 'ajv/dist/2020';
import schema from '../../contracts/window-offer-v1.schema.json';
import schemaV2 from '../../contracts/window-offer-v2.schema.json';
import type {documentReport} from './workspace-document';

export const OFFER_FIELDS=['quantity','kind','width_mm','height_mm','transport_extension_mm','opening','color_inside','color_outside','glazing_panes','ug','profile_reference'] as const;
type Field=typeof OFFER_FIELDS[number];
type Reading=ReturnType<typeof documentReport>;
type Issue={position_id:string|null;page:number|null;field:string;reason:string;primary_requirements?:string[];independent_requirements?:string[]};
export type NumericOfferField='width_mm'|'height_mm'|'transport_extension_mm'|'quantity';
export type TextOfferField='color_inside'|'color_outside'|'opening';
type Correction={position_id:string;source_id:string;quote:string}&({field:NumericOfferField;before:number|null;value:number}|{field:TextOfferField;before:string|null;value:string});
export type OfferSpecification={
 schema_version:'window-offer/1'|'window-offer/2';source:{kind:'text'|'pdf';sha256:string;pages:number|null};
 positions:(Omit<Reading['positions'][number],'evidence'>&{source_id:string;source_page:number|null;evidence:{page:number|null;description:string}[];field_status:Record<Field,'reported'|'missing'|'conflict'|'corrected'>})[];
 notes:string[];audit_issues:Issue[];corrections:Correction[];requires_clarification:boolean;sales_review_required:true;executed:false;
};
// Keep the schema byte-identical to wh-ai-parser/contracts; both runtimes
// validate the exported payload, never infer readiness from a file extension.
const validate=new Ajv({strict:true}).compile(schema);
const validateV2=new Ajv({strict:true}).compile(schemaV2);
export function offerSpecification(value:unknown):OfferSpecification {
 const version=(value as {schema_version?:unknown}|null)?.schema_version;
 if(!(version==='window-offer/1'?validate(value):version==='window-offer/2'?validateV2(value):false))throw Error('INVALID_OFFER_SPECIFICATION');
 const spec=value as OfferSpecification,ids=new Set(spec.positions.map(p=>p.id));
 if(ids.size!==spec.positions.length)throw Error('DUPLICATE_OFFER_POSITION');
 const pdf=spec.source.kind==='pdf',pages=spec.source.pages;
 if(pdf?(pages===null):pages!==null)throw Error('INVALID_OFFER_SOURCE');
 for(const p of spec.positions){
  if(pdf?(!p.source_page||p.source_page>pages!||p.evidence.some(e=>!e.page||e.page>pages!)):p.source_page!==null||p.evidence.some(e=>e.page!==null))throw Error('INVALID_OFFER_SOURCE');
  for(const field of OFFER_FIELDS){
   if((p[field]===null)!==(p.field_status[field]==='missing'))throw Error('INVALID_OFFER_FIELD_STATUS');
   if(p.field_status[field]==='corrected'&&!spec.corrections.some(c=>c.position_id===p.id&&c.field===field&&c.value===p[field]))throw Error('INVALID_OFFER_CORRECTION');
  }
 }
 if(spec.audit_issues.some(i=>i.position_id!==null&&!ids.has(i.position_id)))throw Error('UNKNOWN_OFFER_POSITION');
 for(const c of spec.corrections){const p=spec.positions.find(p=>p.id===c.position_id);if(!p||p.source_id!==c.source_id||p[c.field]!==c.value)throw Error('INVALID_OFFER_CORRECTION');}
 const unresolved=!spec.positions.length||spec.audit_issues.length>0||spec.positions.some(p=>p.ambiguities.length>0||['quantity','width_mm','height_mm'].some(k=>p[k as Field]===null)||Object.values(p.field_status).includes('conflict'));
 if(unresolved&&!spec.requires_clarification)throw Error('UNRESOLVED_OFFER_SPECIFICATION');
 return spec;
}

export function toOfferSpecification(report:Reading&{reading_audit?:{issues?:Issue[]};user_corrections?:unknown},source:OfferSpecification['source']):OfferSpecification {
 const issues=(report.reading_audit?.issues??[]).map(i=>({...i,page:source.kind==='text'?null:i.page}));
 const corrections=(report.user_corrections??[]) as Correction[];
 const positions=report.positions.map(raw=>{
  const p=raw as typeof raw&{source_id?:string;source_page?:number};
  const field_status=Object.fromEntries(OFFER_FIELDS.map(field=>[field,p[field]===null?'missing':p.ambiguities.length||issues.some(i=>(i.position_id===null||i.position_id===p.id)&&(i.field===field||!OFFER_FIELDS.includes(i.field as Field)))?'conflict':corrections.some(c=>c.position_id===p.id&&c.field===field)?'corrected':'reported'])) as OfferSpecification['positions'][number]['field_status'];
  return {...Object.fromEntries(OFFER_FIELDS.map(field=>[field,p[field]])),id:p.id,source_id:p.source_id??p.id,source_page:source.kind==='pdf'?(p.source_page??p.evidence[0].page):null,requirements:[...p.requirements],evidence:p.evidence.map(e=>({...e,page:source.kind==='text'?null:e.page})),ambiguities:[...p.ambiguities],field_status};
 });
 return offerSpecification({schema_version:'window-offer/1',source,positions,notes:[...report.notes],audit_issues:issues,corrections,requires_clarification:report.requires_clarification,sales_review_required:true,executed:false});
}

export function normalizeSalesOpening(report:Reading):Reading {
 return {...report,positions:report.positions.map(p=>{
  const code=p.opening?.trim().toUpperCase();
  if(!['R','L'].includes(code??'')||!['window','entrance_door','balcony_door'].includes(p.kind))return p;
  const opening=(p.kind==='window'?'DK':'D')+code;
  return {...p,opening,requirements:[...p.requirements,`Konwencja handlowa R/L: ${p.kind==='window'?'okno rozwierno-uchylne':'drzwi rozwierne'}, ${code} → ${opening}.`]};
 })};
}
