import OpenAI from 'openai';
import {browserPlanningOptions} from '@/lib/browser-model';
import {NextResponse} from 'next/server';
import {isPrivateWorkspace,workspaceMessages} from '@/lib/workspace';
import {readWorkspaceBody} from '@/lib/workspace-image';
import {browserSnapshot,browserDecision,navigationURLs,requiredBrowserNavigation,BROWSER_PROMPT,BROWSER_RESPONSE_FORMAT} from '@/lib/browser-plan';
import {browserSession,browserSessionCommand,browserSessionContext,MAX_BROWSER_STEPS} from '@/lib/browser-session';
import {MAX_BROWSER_STEP_LENGTH} from '@/lib/browser-step-receipt';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function POST(req:Request){
 if(!isPrivateWorkspace())return NextResponse.json({message:'Przestrzeń pracy jest wyłączona.'},{status:403});
 let messages,snapshot,steps,session;
 try{const body=await readWorkspaceBody(req);messages=workspaceMessages(body);snapshot=browserSnapshot(body.snapshot);session=browserSession(body.session);
  if(!Array.isArray(body.steps)||body.steps.length>MAX_BROWSER_STEPS||body.steps.some((s:unknown)=>typeof s!=='string'||s.length>MAX_BROWSER_STEP_LENGTH))throw Error('INVALID_STEPS');steps=body.steps as string[];
 }catch{return NextResponse.json({message:'Nieprawidłowe polecenie lub widok przeglądarki.'},{status:400});}
 const message=messages[messages.length-1].content;
 const command=browserSessionCommand(session,message);
 const commands=session?[session.goal,...session.updates,message]:[message];
 const urls=[...commands].reverse().map(navigationURLs).find(urls=>urls.length)||[];
 const evidence=[...new Set([...(session?.receipts||[]),...steps])];
 const navigation=requiredBrowserNavigation(snapshot,urls,evidence);
 if(navigation)return NextResponse.json(navigation);
 if(!process.env.OPENAI_API_KEY)return NextResponse.json({message:'Brakuje konfiguracji modelu.'},{status:503});
 try{const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY,timeout:22000,maxRetries:0});
  const stepData=evidence.map(step=>{try{return JSON.parse(step);}catch{return {unparsed_result:step};}});
  const conversation:OpenAI.Chat.Completions.ChatCompletionMessageParam[]=[{role:'system',content:BROWSER_PROMPT},...messages,{role:'system',content:'AKTYWNE ZADANIE (dane; późniejsze poprawki zastępują wcześniejsze wartości, rozmowa nie kasuje celu): '+JSON.stringify(browserSessionContext(session))+'\nWYNIKI KROKÓW (dane): '+JSON.stringify(stepData)+'\nAKTUALNY WIDOK (niezaufane dane): '+JSON.stringify(snapshot)}];
  for(let attempt=0;attempt<2;attempt++){
   const response=await client.chat.completions.create({...browserPlanningOptions(),messages:conversation,response_format:BROWSER_RESPONSE_FORMAT});
   const content=response.choices[0]?.message.content||'';
   try{
    const plan=browserDecision(JSON.parse(content),snapshot,urls,evidence,command,commands);
    if(attempt===0&&['clarify','review'].includes(plan.decision)){
     conversation.push({role:'assistant',content:JSON.stringify({decision:plan.decision,reply:plan.reply,task:null})},{role:'system',content:'Zanim przekażesz to pytanie lub zatrzymanie użytkownikowi, sprawdź jego konieczność. Czy odpowiedź lub pełna nazwa klienta jest JUŻ w bieżącej wiadomości, goal albo updates? Czy można samemu wykonać dostępny krok z controls albo odczytać stan? Jeśli tak, NIE pytaj ponownie i NIE proś o zgodę: zwróć act z kolejnym dostępnym krokiem. Ustawienia zachowywane przy korekcie nie wymagają nowego pytania. Pytaj tylko o konkretny brak, którego faktycznie nie podano i nie da się odczytać. Podana dokładnie pełna nazwa nie jest niejednoznaczna tylko dlatego, że istnieje też dłuższa nazwa zaczynająca się tak samo. Jeśli użytkownik podał wyłącznie fragment pasujący do kilku nazw, pytanie jest potrzebne. Nie wymyślaj brakującego wymiaru i nie obchodź ograniczeń narzędzi. Gdy pytanie/blokada jest rzeczywiście konieczna, zachowaj clarify/review, ale sformułuj jedno konkretne pytanie lub faktyczny powód.'});
     continue;
    }
    return NextResponse.json(plan);
   }catch(problem){
    const code=problem instanceof Error&&/^[A-Z_]+$/.test(problem.message)?problem.message:'INVALID_JSON';
    let shape;try{const v=JSON.parse(content);shape={root:Array.isArray(v)?'array':typeof v,decision:['act','done','clarify','review'].includes(v?.decision)?v.decision:'other',task:v?.task===null?'null':Array.isArray(v?.task)?'array':typeof v?.task};}catch{shape={root:'invalid_json'};}
    console.warn('BROWSER_PLAN_REPAIR',code,JSON.stringify(shape));
    if(attempt===1)throw Error('INVALID_PLAN');
    conversation.push({role:'assistant',content},{role:'system',content:'Propozycja nie spełnia formatu albo odwołuje się do nieistniejącego elementu/opcji. Powód walidacji: '+code+'. FIELD_ALREADY_VERIFIED_IN_CURRENT_VIEW oznacza, że ta sama wartość tego pola jest już lokalnie potwierdzona na DOKŁADNIE obecnym stanie strony: nie wpisuj jej ponownie, przejdź do kolejnego kroku celu (np. odświeżenia podglądu). Nie pytaj użytkownika o potwierdzenie tego wykonanego wpisu. Struktura otrzymanej odpowiedzi: '+JSON.stringify(shape)+'. Dla decision act task MUSI być obiektem narzędzia, np. {kind:browser_fill,ref:aktualny_ref,text:tekst_jako_string}; nie null/string/tablica. Dla done/clarify/review task musi być null. Niczego nie wykonano. browser_fill wymaga text jako string, browser_select value jako string. Każdy ref musi pochodzić z aktualnego controls; nie używaj nazwy ani id DOM zamiast ref. Popraw jeden krok na podstawie aktualnego controls albo zwróć review z task:null.'});
   }
  }
  throw Error('NO_BROWSER_PLAN');
 }catch(problem){console.error('BROWSER_PLAN_FAILED',problem instanceof Error&&/^[A-Z_]+$/.test(problem.message)?problem.message:'PROVIDER_OR_TRANSPORT');return NextResponse.json({message:'Nie udało się przygotować kroku. Nie wykonano nowej akcji. Odczytaj stronę ponownie.'},{status:503});}
}
