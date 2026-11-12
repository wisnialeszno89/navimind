import Link from "next/link";
import { ArrowLeft, CheckCircle2, Download, KeyRound, LockKeyhole, Monitor, ShieldCheck, ShoppingCart } from "lucide-react";

export const metadata={title:"Licencja NaviMind – podgląd aktywacji"};
const steps=[
  {name:"Wybór pakietu",desc:"Użytkownik wybiera Personal lub Business.",icon:ShoppingCart},
  {name:"Potwierdzona płatność",desc:"Serwer weryfikuje opłaconą subskrypcję.",icon:CheckCircle2},
  {name:"Indywidualny kod",desc:"Licencja trafia wyłącznie do uprawnionego klienta.",icon:KeyRound},
  {name:"Aktywacja stanowiska",desc:"Po zgodzie użytkownika aplikacja paruje komputer.",icon:Monitor}
];
export default function LicensePreviewPage(){
 return <main className="nm-page pb-24 pt-16">
  <div className="nm-shell">
    <div className="max-w-3xl"><span className="nm-kicker"><ShieldCheck size={15}/> Aktywacja na Twoich zasadach</span><h1 className="nm-display mt-7">Twoja licencja.<br/><span style={{color:"#6753a6"}}>Twoja kontrola.</span></h1><p className="nm-lead mt-6">Zobacz, jak po uruchomieniu sprzedaży będzie przebiegał zakup, wydanie kodu i aktywacja komputera. Teraz to wyłącznie prezentacja.</p><div className="nm-note mt-7">Tryb demonstracyjny: płatności, wydawanie kodów, instalator i aktywacja urządzeń są wyłączone.</div></div>
    <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{steps.map(({name,desc,icon:Icon},i)=><div className="nm-card p-6" key={name}><div className="flex items-center justify-between"><div className="nm-step-number">0{i+1}</div><Icon className="text-[#6753a6]" size={23}/></div><h2 className="mt-6 text-lg font-bold">{name}</h2><p className="mt-2 text-sm leading-7 text-[#746c7c]">{desc}</p></div>)}</div>
    <div className="nm-card mt-12 grid gap-9 p-7 sm:p-10 lg:grid-cols-2">
      <div><span className="nm-label">Wizualizacja panelu klienta</span><h2 className="mt-4 text-3xl font-bold">Moja licencja</h2><dl className="mt-7 space-y-4 text-sm">
       <div className="flex justify-between gap-3 border-b border-[#ebe9f0] pb-4"><dt className="nm-muted">Status zakupu</dt><dd className="font-semibold text-[#765b9c]">Nieaktywny</dd></div>
       <div className="flex justify-between gap-3 border-b border-[#ebe9f0] pb-4"><dt className="nm-muted">Licencja</dt><dd className="font-semibold">Nieprzydzielona</dd></div>
       <div className="flex justify-between gap-3 border-b border-[#ebe9f0] pb-4"><dt className="nm-muted">Kod aktywacyjny</dt><dd className="font-mono text-[#a39aab]">•••• •••• ••••</dd></div>
       <div className="flex justify-between gap-3 border-b border-[#ebe9f0] pb-4"><dt className="nm-muted">Połączone urządzenia</dt><dd className="font-semibold">0</dd></div>
      </dl></div>
      <div className="rounded-2xl border border-[#e5e0ed] bg-[#faf9fd] p-6">
       <div className="flex items-center gap-3"><Monitor className="text-[#6753a6]"/><h3 className="text-lg font-bold">Aktywuj komputer</h3></div>
       <label htmlFor="nm-inactive-license" className="nm-label mt-8 block">Kod po opłaceniu subskrypcji</label>
       <input id="nm-inactive-license" disabled placeholder="Kod dostępny po zakupie" className="mt-3 w-full rounded-xl border border-[#ded9e7] bg-white px-4 py-3 text-sm text-[#726c7b]"/>
       <button disabled className="mt-4 w-full rounded-xl bg-[#6753a6] px-4 py-3 font-semibold text-white">Aktywacja niedostępna</button>
       <button disabled className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d9d4e2] bg-white px-4 py-3 text-sm text-[#786e80]"><Download size={17}/> Instalator w przygotowaniu</button>
       <p className="mt-4 text-xs leading-6 text-[#7b7583]">Pola demonstracyjne nie wysyłają danych i nie komunikują się z komputerem.</p>
      </div>
    </div>
    <div className="mt-8 flex max-w-4xl items-start gap-3 rounded-2xl border border-[#ded8ee] bg-[#f1edf9] p-5 text-sm leading-7 text-[#5f5374]"><LockKeyhole size={20} className="mt-1 shrink-0"/> Kod licencji nie jest zdalnym hasłem do komputera. Aktywacja urządzenia i zgoda na wykonywanie zadań będą osobnymi etapami.</div>
    <Link href="/plans" className="nm-btn-secondary mt-9"><ArrowLeft size={17}/> Wróć do pakietów</Link>
  </div>
 </main>;
}
