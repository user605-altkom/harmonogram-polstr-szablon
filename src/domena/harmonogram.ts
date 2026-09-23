export interface ParametryKredytu {
  /** Kwota kredytu w groszach. */
  kwotaGr: number;
  liczbaRat: number;
  /** Marża banku jako ułamek, np. 0.0211 dla 2,11 pp. */
  marza: number;
  typRat: 'rowne' | 'malejace';
  wskaznik: 'POLSTR_1M' | 'WIBOR_3M';
  /** Data pierwszej raty w formacie YYYY-MM-DD. */
  pierwszaRata: string;
  seriaWskaznika: WpisSerii[];
}

export interface WpisSerii {
  od: string;
  stopa: number;
}

export interface RataHarmonogramu {
  numer: number;
  data: string;
  kapitalGr: number;
  odsetkiGr: number;
  rataGr: number;
  nadplataGr: number;
  saldoGr: number;
}

export interface Harmonogram {
  raty: RataHarmonogramu[];
  sumaOdsetekGr: number;
  pierwszaRataGr: number;
  ostatniaRataGr: number;
  saldoKoncoweGr: number;
}

function sprawdzParametry(parametry: ParametryKredytu): void {
  if (!Number.isInteger(parametry.kwotaGr) || parametry.kwotaGr <= 0) {
    throw new Error('kwotaGr musi być dodatnią liczbą całkowitą w groszach');
  }
  if (!Number.isInteger(parametry.liczbaRat) || parametry.liczbaRat <= 0) {
    throw new Error('liczbaRat musi być dodatnią liczbą całkowitą');
  }
  if (!Number.isFinite(parametry.marza) || parametry.marza < 0) {
    throw new Error('marza musi być nieujemną liczbą');
  }
  if (parametry.typRat !== 'rowne' && parametry.typRat !== 'malejace') {
    throw new Error('nieprawidłowy typ rat');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(parametry.pierwszaRata)) {
    throw new Error('pierwszaRata musi mieć format YYYY-MM-DD');
  }
  const data = new Date(`${parametry.pierwszaRata}T00:00:00.000Z`);
  if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== parametry.pierwszaRata) {
    throw new Error('pierwszaRata musi być poprawną datą');
  }
  if (parametry.seriaWskaznika.length === 0) {
    throw new Error('seria wskaźnika nie może być pusta');
  }
}

function dataRaty(pierwszaRata: string, numerRaty: number): string {
  const [rokTekst, miesiacTekst, dzienTekst] = pierwszaRata.split('-');
  const rok = Number(rokTekst);
  const miesiac = Number(miesiacTekst);
  const dzien = Number(dzienTekst);
  const data = new Date(Date.UTC(rok, miesiac - 1 + numerRaty - 1, 1));
  const ostatniDzienMiesiaca = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth() + 1, 0)).getUTCDate();
  data.setUTCDate(Math.min(dzien, ostatniDzienMiesiaca));
  return data.toISOString().slice(0, 10);
}

function stopaDlaDaty(seria: WpisSerii[], data: string): number {
  const wpis = seria
    .filter((kandydat) => kandydat.od <= data)
    .at(-1);
  if (!wpis) {
    throw new Error(`brak wartości wskaźnika dla daty ${data}`);
  }
  return wpis.stopa;
}

function rataRowna(saldoGr: number, stopaRoczna: number, liczbaRat: number): number {
  const stopaMiesieczna = stopaRoczna / 12;
  if (stopaMiesieczna === 0) {
    return Math.round(saldoGr / liczbaRat);
  }
  const rata = (saldoGr * stopaMiesieczna) / (1 - Math.pow(1 + stopaMiesieczna, -liczbaRat));
  return Math.round(rata);
}

export function policzHarmonogram(parametry: ParametryKredytu): Harmonogram {
  sprawdzParametry(parametry);

  let saldoGr = parametry.kwotaGr;
  const raty: RataHarmonogramu[] = [];
  const stopaRoczna = stopaDlaDaty(parametry.seriaWskaznika, parametry.pierwszaRata) + parametry.marza;
  const rataRownaGr = rataRowna(saldoGr, stopaRoczna, parametry.liczbaRat);

  for (let numer = 1; numer <= parametry.liczbaRat && saldoGr > 0; numer += 1) {
    const data = dataRaty(parametry.pierwszaRata, numer);
    const stopaOkresu = stopaDlaDaty(parametry.seriaWskaznika, data) + parametry.marza;
    const odsetkiGr = Math.round((saldoGr * stopaOkresu) / 12);
    const pozostaleRat = parametry.liczbaRat - numer + 1;
    const zaplanowanyKapitalGr = parametry.typRat === 'rowne'
      ? rataRownaGr - odsetkiGr
      : Math.round(saldoGr / pozostaleRat);
    const kapitalGr = numer === parametry.liczbaRat
      ? saldoGr
      : Math.min(saldoGr, Math.max(0, zaplanowanyKapitalGr));
    const rataGr = kapitalGr + odsetkiGr;
    saldoGr -= kapitalGr;
    raty.push({ numer, data, kapitalGr, odsetkiGr, rataGr, nadplataGr: 0, saldoGr });
  }

  const ostatniaRata = raty.at(-1);
  if (!ostatniaRata) {
    throw new Error('nie udało się utworzyć harmonogramu');
  }

  return {
    raty,
    sumaOdsetekGr: raty.reduce((suma, rata) => suma + rata.odsetkiGr, 0),
    pierwszaRataGr: raty[0]?.rataGr ?? 0,
    ostatniaRataGr: ostatniaRata.rataGr,
    saldoKoncoweGr: saldoGr,
  };
}
