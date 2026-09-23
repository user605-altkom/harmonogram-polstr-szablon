'use client';

import { useState, type FormEvent } from 'react';

type Wskaznik = 'POLSTR_1M' | 'WIBOR_3M';
type TypRat = 'rowne' | 'malejace';
type TrybNadplaty = 'obnizRate' | 'skrocOkres';

interface Formularz { kwota: string; liczbaRat: string; marza: string; pierwszaRata: string; wskaznik: Wskaznik; typRat: TypRat; }
interface NadplataFormularza { id: number; miesiac: string; kwota: string; tryb: TrybNadplaty; }
interface Rata { numer: number; data: string; kapitalGr: number; odsetkiGr: number; rataGr: number; nadplataGr: number; saldoGr: number; }
interface Harmonogram { raty: Rata[]; sumaOdsetekGr: number; pierwszaRataGr: number; ostatniaRataGr: number; saldoKoncoweGr: number; }
type Stan = 'pusty' | 'ladowanie' | 'sukces' | 'blad';

const poczatkowyFormularz: Formularz = { kwota: '400000', liczbaRat: '300', marza: '2.11', pierwszaRata: '2026-10-01', wskaznik: 'POLSTR_1M', typRat: 'rowne' };
const formatZl = (grosze: number): string => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(grosze / 100);
const formatData = (data: string): string => { const [rok, miesiac, dzien] = data.split('-'); return `${dzien}.${miesiac}.${rok}`; };
const parsujLiczbe = (wartosc: string): number => Number(wartosc.replace(/\s/g, '').replace(',', '.'));

export function zbudujQuery(formularz: Formularz, nadplaty: NadplataFormularza[]): URLSearchParams {
  const query = new URLSearchParams({ kwota: String(parsujLiczbe(formularz.kwota)), liczbaRat: formularz.liczbaRat, marza: String(parsujLiczbe(formularz.marza)), wskaznik: formularz.wskaznik, typRat: formularz.typRat, pierwszaRata: formularz.pierwszaRata });
  query.set('nadplaty', JSON.stringify(nadplaty.map((nadplata) => ({ miesiac: parsujLiczbe(nadplata.miesiac), kwota: parsujLiczbe(nadplata.kwota), tryb: nadplata.tryb }))));
  return query;
}

async function pobierzHarmonogram(query: URLSearchParams): Promise<Harmonogram> {
  const odpowiedz = await fetch(`/api/harmonogram?${query.toString()}`);
  const dane: unknown = await odpowiedz.json();
  if (!odpowiedz.ok) { const blad = dane as { blad?: string }; throw new Error(blad.blad ?? 'Nie udało się obliczyć harmonogramu.'); }
  return dane as Harmonogram;
}

function eksportujCsv(harmonogram: Harmonogram): void {
  const kwota = (grosze: number) => (grosze / 100).toFixed(2).replace('.', ',');
  const naglowek = ['Nr', 'Data', 'Kapitał', 'Odsetki', 'Rata', 'Nadpłata', 'Saldo po spłacie'];
  const wiersze = harmonogram.raty.map((rata) => [rata.numer, rata.data, kwota(rata.kapitalGr), kwota(rata.odsetkiGr), kwota(rata.rataGr), kwota(rata.nadplataGr), kwota(rata.saldoGr)].join(';'));
  const plik = new Blob(['\ufeff', [naglowek.join(';'), ...wiersze].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(plik);
  const link = document.createElement('a'); link.href = url; link.download = 'harmonogram-polstr.csv'; link.click(); URL.revokeObjectURL(url);
}

export default function Strona() {
  const [formularz, ustawFormularz] = useState<Formularz>(poczatkowyFormularz);
  const [nadplaty, ustawNadplaty] = useState<NadplataFormularza[]>([]);
  const [stan, ustawStan] = useState<Stan>('pusty');
  const [blad, ustawBlad] = useState('');
  const [harmonogram, ustawHarmonogram] = useState<Harmonogram | null>(null);
  const [ostatnieId, ustawOstatnieId] = useState(0);

  const zmienFormularz = <K extends keyof Formularz>(pole: K, wartosc: Formularz[K]) => ustawFormularz((poprzedni) => ({ ...poprzedni, [pole]: wartosc }));
  const oblicz = async (zdarzenie: FormEvent<HTMLFormElement>) => {
    zdarzenie.preventDefault(); ustawStan('ladowanie'); ustawBlad('');
    try { ustawHarmonogram(await pobierzHarmonogram(zbudujQuery(formularz, nadplaty))); ustawStan('sukces'); }
    catch (bladZapytania) { ustawStan('blad'); ustawBlad(bladZapytania instanceof Error ? bladZapytania.message : 'Nie udało się obliczyć harmonogramu.'); }
  };
  const dodajNadplate = () => { const id = ostatnieId + 1; ustawOstatnieId(id); ustawNadplaty((poprzednie) => [...poprzednie, { id, miesiac: '1', kwota: '1000', tryb: 'skrocOkres' }]); };
  const aktualizujNadplate = (id: number, zmiana: Partial<NadplataFormularza>) => ustawNadplaty((poprzednie) => poprzednie.map((nadplata) => nadplata.id === id ? { ...nadplata, ...zmiana } : nadplata));

  return (
    <div className="min-h-screen bg-tlo text-tekst">
      <header className="border-b border-linia px-4 py-3 md:px-8"><div className="mx-auto flex max-w-[1480px] flex-wrap items-center gap-x-5 gap-y-2"><div className="mr-auto flex min-w-0 flex-wrap items-baseline gap-x-3"><h1 className="text-lg font-medium">Harmonogram POLSTR</h1><p className="text-[13px] text-szary-400">Kalkulator zmiennego oprocentowania kredytu</p></div><span className="text-xs text-szary-400">Wskaźnik</span><span className="tag-accent rounded-full px-2 py-1 text-xs">{formularz.wskaznik === 'POLSTR_1M' ? 'POLSTR 1M' : 'WIBOR 3M'}</span></div></header>
      <div className="mx-auto flex max-w-[1480px] flex-wrap items-start gap-7 px-4 py-6 md:px-8 md:py-8">
        <form onSubmit={oblicz} noValidate aria-label="Parametry kredytu" className="flex min-w-0 flex-1 basis-[320px] flex-col gap-5 rounded-lg bg-powierzchnia p-5 shadow-sm">
          <section className="flex flex-col gap-3.5" aria-labelledby="parametry"><h2 id="parametry" className="kicker">Parametry kredytu</h2><Pole label="Kwota kredytu" unit="zł" value={formularz.kwota} onChange={(value) => zmienFormularz('kwota', value)} /><div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3.5"><Pole label="Liczba rat" unit="mies." value={formularz.liczbaRat} onChange={(value) => zmienFormularz('liczbaRat', value)} /><Pole label="Marża banku" unit="p.p." value={formularz.marza} onChange={(value) => zmienFormularz('marza', value)} /></div><label className="field-label" htmlFor="pierwszaRata">Data pierwszej raty</label><input id="pierwszaRata" type="date" className="input" value={formularz.pierwszaRata} onChange={(e) => zmienFormularz('pierwszaRata', e.target.value)} /><Przelacznik label="Wskaźnik" value={formularz.wskaznik} options={[['POLSTR_1M', 'POLSTR 1M'], ['WIBOR_3M', 'WIBOR 3M']]} onChange={(value) => zmienFormularz('wskaznik', value)} /><Przelacznik label="Typ rat" value={formularz.typRat} options={[['rowne', 'Raty równe'], ['malejace', 'Raty malejące']]} onChange={(value) => zmienFormularz('typRat', value)} /></section>
          <section className="flex flex-col gap-2.5 border-t border-linia pt-4" aria-labelledby="nadplaty"><div className="flex items-center justify-between gap-2"><h2 id="nadplaty" className="kicker">Nadpłaty {nadplaty.length > 0 && `(${nadplaty.length})`}</h2><button type="button" className="btn-ghost" onClick={dodajNadplate}>＋ Dodaj nadpłatę</button></div>{nadplaty.length === 0 ? <p className="empty-row">Brak zaplanowanych nadpłat</p> : nadplaty.map((nadplata) => <div key={nadplata.id} className="grid grid-cols-[minmax(64px,.7fr)_minmax(0,1.3fr)_auto] items-end gap-2 border-b border-linia pb-2.5"><Pole label="Nr raty" value={nadplata.miesiac} onChange={(value) => aktualizujNadplate(nadplata.id, { miesiac: value })} /><Pole label="Kwota (zł)" value={nadplata.kwota} onChange={(value) => aktualizujNadplate(nadplata.id, { kwota: value })} /><button type="button" className="btn-icon" aria-label={`Usuń nadpłatę z raty ${nadplata.miesiac}`} onClick={() => ustawNadplaty((poprzednie) => poprzednie.filter((item) => item.id !== nadplata.id))}>×</button><label className="field-label col-span-full" htmlFor={`tryb-${nadplata.id}`}>Tryb nadpłaty</label><select id={`tryb-${nadplata.id}`} className="input col-span-full" value={nadplata.tryb} onChange={(e) => aktualizujNadplate(nadplata.id, { tryb: e.target.value as TrybNadplaty })}><option value="obnizRate">Obniż ratę</option><option value="skrocOkres">Skróć okres</option></select></div>)}</section>
          <button type="submit" className="btn-primary" disabled={stan === 'ladowanie'}>{stan === 'ladowanie' ? 'Obliczanie…' : 'Policz harmonogram'}</button><p className="text-xs text-szary-500">Wynik liczy serwer. Ekran nie wykonuje obliczeń finansowych.</p>
        </form>
        <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-5"><div role="status" aria-live="polite" className="status-bar"><span className="status-dot">{stan === 'blad' ? '!' : stan === 'sukces' ? '✓' : stan === 'ladowanie' ? '…' : '·'}</span><strong>{stan === 'ladowanie' ? 'Obliczanie harmonogramu…' : stan === 'blad' ? 'Nie udało się obliczyć harmonogramu' : stan === 'sukces' ? 'Harmonogram gotowy' : 'Brak wyniku'}</strong><span className="text-szary-400">{stan === 'pusty' ? 'Uzupełnij parametry i uruchom obliczenie.' : ''}</span></div>{stan === 'blad' && <div role="alert" className="alert">{blad}</div>}{!harmonogram && stan !== 'blad' && <div className="empty-result"><h2>Brak wyniku</h2><p>Uzupełnij parametry po lewej stronie i wybierz „Policz harmonogram”. Tu pojawi się podsumowanie oraz pełna tabela rat.</p></div>}{harmonogram && <><section aria-labelledby="podsumowanie" className="animate-pojaw"><div className="flex flex-wrap items-baseline justify-between gap-2"><h2 id="podsumowanie" className="text-xl">Podsumowanie</h2><span className="text-[13px] text-szary-400">{formularz.wskaznik === 'POLSTR_1M' ? 'POLSTR 1M' : 'WIBOR 3M'} · {formularz.typRat === 'rowne' ? 'raty równe' : 'raty malejące'} · {formularz.liczbaRat} rat</span></div><dl className="summary-grid"><Stat label="Pierwsza rata" value={formatZl(harmonogram.pierwszaRataGr)} accent /><Stat label="Ostatnia rata" value={formatZl(harmonogram.ostatniaRataGr)} /><Stat label="Suma odsetek" value={formatZl(harmonogram.sumaOdsetekGr)} /><Stat label="Saldo końcowe" value={formatZl(harmonogram.saldoKoncoweGr)} /></dl></section><section aria-labelledby="tabela"><div className="mb-2 flex flex-wrap items-center gap-2"><h2 id="tabela" className="mr-auto text-xl">Harmonogram spłat</h2><button type="button" className="btn-secondary" onClick={() => document.getElementById('rata-1')?.scrollIntoView()}>Pierwsza rata ↑</button><button type="button" className="btn-secondary" onClick={() => document.getElementById(`rata-${harmonogram.raty.length}`)?.scrollIntoView()}>Ostatnia rata ↓</button><button type="button" className="btn-primary" onClick={() => eksportujCsv(harmonogram)}>↓ Eksport CSV</button></div><div className="table-wrap" tabIndex={0} role="region" aria-labelledby="tabela"><table><caption>Harmonogram spłat kredytu, kwoty w złotych</caption><thead><tr><th>Nr</th><th>Data</th><th>Kapitał</th><th>Odsetki</th><th>Rata</th><th>Nadpłata</th><th>Saldo po spłacie</th></tr></thead><tbody>{harmonogram.raty.map((rata) => <tr id={`rata-${rata.numer}`} key={rata.numer}><th scope="row">{rata.numer}</th><td>{formatData(rata.data)}</td><td>{formatZl(rata.kapitalGr)}</td><td>{formatZl(rata.odsetkiGr)}</td><td className="emphasis">{formatZl(rata.rataGr)}</td><td>{formatZl(rata.nadplataGr)}</td><td>{formatZl(rata.saldoGr)}</td></tr>)}</tbody></table></div></section></>}</main>
      </div>
    </div>
  );
}

function Pole(props: { label: string; unit?: string; value: string; onChange: (value: string) => void }) { return <div><label className="field-label">{props.label}</label><div className="relative"><input className="input pr-12" inputMode="decimal" value={props.value} onChange={(e) => props.onChange(e.target.value)} /><span className="unit">{props.unit}</span></div></div>; }
function Przelacznik<T extends string>(props: { label: string; value: T; options: [T, string][]; onChange: (value: T) => void }) { return <fieldset><legend className="field-label">{props.label}</legend><div className="segmented">{props.options.map(([value, label]) => <label key={value} className={props.value === value ? 'selected' : ''}><input type="radio" checked={props.value === value} onChange={() => props.onChange(value)} />{label}</label>)}</div></fieldset>; }
function Stat(props: { label: string; value: string; accent?: boolean }) { return <div className={props.accent ? 'stat stat-accent' : 'stat'}><dt>{props.label}</dt><dd>{props.value}</dd></div>; }

