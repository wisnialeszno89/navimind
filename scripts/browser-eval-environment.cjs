// Shared synthetic browser for API/model evaluations; never a real Chromium test.
const crypto=require('node:crypto');
const fields=['customer','width','height','color','opening'];
const names={search:'Wyszukaj klienta',width:'Szerokość [mm]',height:'Wysokość [mm]',color:'Kolor zewnętrzny',opening:'Otwieranie'};
const customers=['Top Trans S.A.','Top Trans','Baupartner'];
const options={color:[{label:'Wybierz kolor',value:''},{label:'Biały',value:'bialy'},{label:'Antracyt',value:'antracyt'},{label:'Mahoń',value:'mahon'}],opening:[{label:'Wybierz okucie',value:''},{label:'DKL',value:'DKL'},{label:'DKR',value:'DKR'}]};
function summary(s){return `PODGLĄD GOTOWY\nKlient: ${s.customer}\nSzerokość: ${s.width} mm\nWysokość: ${s.height} mm\nKolor: ${s.color}\nOkucie: ${s.opening}`;}
function createBrowserEval(seed=null){
 let sequence=0;
  const state={search:'',customer:'',width:'',height:'',color:'',opening:'',preview:'',results:[],...seed};
  if(seed)state.preview=summary(state);
  function snapshot(){
   const controls=[];
   function add(name,tag,type,value='',extra={}){controls.push({ref:'e'+crypto.randomBytes(8).toString('hex'),tag,role:'',type,name,href:'',disabled:false,checked:false,value_present:!!value,submits_form:false,...extra});}
   add(names.search,'input','search',state.search);
   for(const name of state.results)add(name,'button','button');
   add(names.width,'input','number',state.width);add(names.height,'input','number',state.height);
   add(names.color,'select','select-one',state.color,{options:options.color});add(names.opening,'select','select-one',state.opening,{options:options.opening});add('Pokaż podgląd','button','button');
   return {revision:crypto.createHash('sha256').update(JSON.stringify({state,sequence})).digest('hex'),url:'about:blank',title:'NaviMind — laboratorium przeglądarki',scope:'owned_chromium_tab',controls,text:'Klient i okno\n'+(state.customer?'Wybrany klient: '+state.customer:'Nie wybrano klienta.')+'\nWyszukaj klienta\n'+state.results.join('\n')+'\nSzerokość [mm]\nWysokość [mm]\nKolor zewnętrzny Wybierz kolor Biały Antracyt Mahoń\nOtwieranie Wybierz okucie DKL DKR\nPokaż podgląd\n'+state.preview};
  }
  function apply(task,before,phase){
   sequence++;
   if(task.kind==='browser_scroll')return; // Small owned form; scrolling changes no values.
   const c=before.controls.find(c=>c.ref===task.ref);if(!c)throw Error('UNKNOWN_SYNTHETIC_TARGET');
   if(task.kind==='browser_fill'||task.kind==='browser_select'){
    const key=Object.keys(names).find(key=>names[key]===c.name);if(!key)throw Error('UNKNOWN_SYNTHETIC_FIELD');
    if(key!=='search'&&!phase.allowed_write_fields.includes(key))throw Error('UNREQUESTED_FIELD_WRITE '+key);
    const value=task.text??task.value;
    if(key!=='search'&&phase.expected&&value!==phase.expected[key])throw Error('WRONG_REQUESTED_VALUE '+key);
    state[key]=value;
    if(key==='search')state.results=customers.filter(name=>state.search&&name.toLowerCase().includes(state.search.toLowerCase()));
    else state.preview='';
   }else if(task.kind==='browser_click'&&customers.includes(c.name)){
    if(!phase.allowed_write_fields.includes('customer'))throw Error('UNREQUESTED_CUSTOMER_SELECTION');
    state.customer=c.name;state.results=[];state.preview='';
   }else if(task.kind==='browser_click'&&c.name==='Pokaż podgląd'){
    state.preview=state.customer&&Number(state.width)>=100&&Number(state.width)<=10000&&Number(state.height)>=100&&Number(state.height)<=10000&&state.color&&state.opening?summary(state):'Uzupełnij klienta, wymiary, kolor i okucie.';
    if(!phase.expected&&state.preview.startsWith('PODGLĄD GOTOWY'))throw Error('UNREQUESTED_READY_PREVIEW');
   }else throw Error('UNSUPPORTED_SYNTHETIC_ACTION');
  }

 return {state,snapshot,apply,summary:()=>summary(state)};
}
module.exports={createBrowserEval};
