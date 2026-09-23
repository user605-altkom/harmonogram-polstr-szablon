import { describe, expect, it } from 'vitest';
import { seriaWskaznika } from '../src/dane/wskazniki';
import { policzHarmonogram, type ParametryKredytu, type WpisSerii } from '../src/domena/harmonogram';

const stalaSeria: WpisSerii[] = [{ od: '2026-10-01', stopa: 0.0355 }];

function parametryBazowe(overrides: Partial<ParametryKredytu> = {}): ParametryKredytu {
  return {
    kwotaGr: 400_000_00,
    liczbaRat: 300,
    marza: 0.0211,
    typRat: 'rowne',
    wskaznik: 'POLSTR_1M',
    pierwszaRata: '2026-10-01',
    seriaWskaznika: stalaSeria,
    nadplaty: [],
    ...overrides,
  };
}

describe('dane wskaźników z katalogu dane/', () => {
  it.each(['POLSTR_1M', 'WIBOR_3M'] as const)('%s ma serię uporządkowaną rosnąco po dacie', (wskaznik) => {
    const seria = seriaWskaznika(wskaznik);
    expect(seria.length).toBeGreaterThan(0);
    for (const wpis of seria) {
      expect(wpis.od).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(wpis.stopa).toBeGreaterThan(0);
      expect(wpis.stopa).toBeLessThan(0.2);
    }
    expect(seriaWskaznika(wskaznik)).toEqual(seria);
    const daty = seria.map((wpis) => wpis.od);
    expect([...daty].sort()).toEqual(daty);
  });
});

describe('domena', () => {
  it('liczy ratę równą zgodnie z liczbą kontrolną', () => {
    const harmonogram = policzHarmonogram(parametryBazowe());
    const pierwszaRata = harmonogram.raty.at(0);
    const ostatniaRata = harmonogram.raty.at(-1);

    expect(pierwszaRata?.rataGr).toBe(249_472);
    expect(ostatniaRata?.rataGr).toBe(249_253);
    expect(harmonogram.raty.reduce((suma, rata) => suma + rata.kapitalGr, 0)).toBe(400_000_00);
    expect(harmonogram.saldoKoncoweGr).toBe(0);
  });

  it('liczy raty malejące i kończy saldo na zero', () => {
    const harmonogram = policzHarmonogram(parametryBazowe({ typRat: 'malejace', liczbaRat: 12 }));
    const raty = harmonogram.raty.map((rata) => rata.rataGr);
    const pierwszaRata = raty.at(0);
    const ostatniaRata = raty.at(-1);

    expect(harmonogram.raty).toHaveLength(12);
    expect(pierwszaRata).toBeGreaterThan(ostatniaRata ?? 0);
    expect(raty.every((rata, index) => index === 0 || rata <= (raty[index - 1] ?? rata))).toBe(true);
    expect(harmonogram.saldoKoncoweGr).toBe(0);
  });

  it('wyrównuje ostatni kapitał po zaokrągleniach', () => {
    const harmonogram = policzHarmonogram(parametryBazowe({ kwotaGr: 1_000_01, liczbaRat: 3 }));

    expect(harmonogram.raty.reduce((suma, rata) => suma + rata.kapitalGr, 0)).toBe(1_000_01);
    expect(harmonogram.raty.every((rata) => rata.saldoGr >= 0)).toBe(true);
    expect(harmonogram.raty.at(-1)?.saldoGr).toBe(0);
  });

  it('stosuje nową wartość wskaźnika od dnia wpisu', () => {
    const harmonogram = policzHarmonogram(
      parametryBazowe({
        liczbaRat: 4,
        seriaWskaznika: [
          { od: '2026-10-01', stopa: 0.03 },
          { od: '2026-11-01', stopa: 0.06 },
        ],
      }),
    );

    expect(harmonogram.raty[0]?.odsetkiGr).toBe(170_333);
    expect(harmonogram.raty[1]?.odsetkiGr).toBeGreaterThan(harmonogram.raty[0]?.odsetkiGr ?? 0);
  });

  it('używa ostatniej znanej wartości po końcu serii', () => {
    const harmonogram = policzHarmonogram(
      parametryBazowe({
        liczbaRat: 4,
        seriaWskaznika: [{ od: '2026-10-01', stopa: 0.03 }],
      }),
    );

    expect(harmonogram.raty).toHaveLength(4);
    expect(harmonogram.raty[3]?.odsetkiGr).toBeGreaterThan(0);
  });

  it('odrzuca serię bez wartości przed pierwszą ratą', () => {
    expect(() =>
      policzHarmonogram(
        parametryBazowe({ seriaWskaznika: [{ od: '2026-11-01', stopa: 0.03 }] }),
      ),
    ).toThrow('brak wartości wskaźnika');
  });

  it('stosuje nadpłatę po racie i obniża kolejne raty', () => {
    const bezNadplaty = policzHarmonogram(parametryBazowe({ liczbaRat: 4, nadplaty: [] }));
    const zNadplata = policzHarmonogram(
      parametryBazowe({
        liczbaRat: 4,
        nadplaty: [{ miesiac: 1, kwotaGr: 50_000, tryb: 'obnizRate' }],
      }),
    );

    expect(zNadplata.raty[0]?.nadplataGr).toBe(50_000);
    expect(zNadplata.raty[1]?.rataGr).toBeLessThan(bezNadplaty.raty[1]?.rataGr ?? 0);
    expect(zNadplata.raty).toHaveLength(4);
    expect(zNadplata.saldoKoncoweGr).toBe(0);
  });

  it('stosuje nadpłatę i skraca okres przy zachowaniu raty', () => {
    const bezNadplaty = policzHarmonogram(parametryBazowe({ liczbaRat: 12, nadplaty: [] }));
    const zNadplata = policzHarmonogram(
      parametryBazowe({
        liczbaRat: 12,
        nadplaty: [{ miesiac: 1, kwotaGr: 100_000_00, tryb: 'skrocOkres' }],
      }),
    );

    expect(zNadplata.raty[0]?.nadplataGr).toBe(100_000_00);
    expect(zNadplata.raty[1]?.rataGr).toBe(bezNadplaty.raty[1]?.rataGr);
    expect(zNadplata.raty.length).toBeLessThan(bezNadplaty.raty.length);
    expect(zNadplata.saldoKoncoweGr).toBe(0);
  });

  it('odrzuca nadpłatę po końcu okresu i nie tworzy ujemnego salda', () => {
    expect(() =>
      policzHarmonogram(
        parametryBazowe({ liczbaRat: 3, nadplaty: [{ miesiac: 4, kwotaGr: 1, tryb: 'obnizRate' }] }),
      ),
    ).toThrow('nadpłata musi przypadać');

    const harmonogram = policzHarmonogram(
      parametryBazowe({ liczbaRat: 3, nadplaty: [{ miesiac: 1, kwotaGr: 999_999_99, tryb: 'skrocOkres' }] }),
    );
    expect(harmonogram.raty[0]?.saldoGr).toBe(0);
    expect(harmonogram.raty.every((rata) => rata.saldoGr >= 0)).toBe(true);
  });

  it('testy działają w strefie Europe/Warsaw', () => {
    expect(process.env.TZ).toBe('Europe/Warsaw');
  });
});
