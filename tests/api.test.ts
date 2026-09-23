import { describe, expect, it } from 'vitest';
import { GET } from '../app/api/harmonogram/route';

const adresBazowy = 'http://localhost/api/harmonogram';

function request(query: string): Request {
  return new Request(`${adresBazowy}?${query}`);
}

describe('GET /api/harmonogram', () => {
  it('zwraca harmonogram zgodny z kontraktem', async () => {
    const odpowiedz = await GET(
      request('kwota=400000&liczbaRat=12&marza=2.11&wskaznik=POLSTR_1M&typRat=rowne&pierwszaRata=2026-10-01'),
    );
    const dane: unknown = await odpowiedz.json();

    expect(odpowiedz.status).toBe(200);
    expect(dane).toMatchObject({
      raty: expect.any(Array),
      sumaOdsetekGr: expect.any(Number),
      pierwszaRataGr: expect.any(Number),
      ostatniaRataGr: expect.any(Number),
      saldoKoncoweGr: 0,
    });
  });

  it('zwraca 400 bez częściowego wyniku dla błędnych parametrów', async () => {
    const odpowiedz = await GET(request('kwota=-1&liczbaRat=12&marza=2.11&wskaznik=POLSTR_1M&typRat=rowne&pierwszaRata=2026-10-01'));
    const dane = (await odpowiedz.json()) as { blad?: string; raty?: unknown[] };

    expect(odpowiedz.status).toBe(400);
    expect(dane.blad).toContain('kwota');
    expect(dane.raty).toBeUndefined();
  });

  it('przekazuje nadpłatę do domeny', async () => {
    const nadplaty = encodeURIComponent(JSON.stringify([{ miesiac: 1, kwota: 1000, tryb: 'obnizRate' }]));
    const odpowiedz = await GET(
      request(`kwota=400000&liczbaRat=12&marza=2.11&wskaznik=POLSTR_1M&typRat=rowne&pierwszaRata=2026-10-01&nadplaty=${nadplaty}`),
    );
    const dane = (await odpowiedz.json()) as { raty?: Array<{ nadplataGr: number }> };

    expect(odpowiedz.status).toBe(200);
    expect(dane.raty?.[0]?.nadplataGr).toBe(100_000);
  });

  it('domyślnie wybiera skrócenie okresu, gdy nadpłata nie ma trybu', async () => {
    const brakTrybu = encodeURIComponent(JSON.stringify([{ miesiac: 1, kwota: 30000 }]));
    const jawnyTryb = encodeURIComponent(JSON.stringify([{ miesiac: 1, kwota: 30000, tryb: 'skrocOkres' }]));
    const odpowiedz = await GET(
      request(`kwota=300000&liczbaRat=240&marza=2.11&wskaznik=WIBOR_3M&typRat=rowne&pierwszaRata=2026-10-01&nadplaty=${brakTrybu}`),
    );
    const odpowiedzJawna = await GET(
      request(`kwota=300000&liczbaRat=240&marza=2.11&wskaznik=WIBOR_3M&typRat=rowne&pierwszaRata=2026-10-01&nadplaty=${jawnyTryb}`),
    );
    const dane = await odpowiedz.json();
    const daneJawne = await odpowiedzJawna.json();

    expect(odpowiedz.status).toBe(200);
    expect(odpowiedzJawna.status).toBe(200);
    expect(dane).toEqual(daneJawne);
  });
});
