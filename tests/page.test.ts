import { describe, expect, it } from 'vitest';
import { zbudujQuery } from '../app/page';

describe('kontrakt formularza harmonogramu', () => {
  it('serializuje nadpłaty do parametrów API', () => {
    const query = zbudujQuery(
      {
        kwota: '400000',
        liczbaRat: '300',
        marza: '2.11',
        pierwszaRata: '2026-10-01',
        wskaznik: 'POLSTR_1M',
        typRat: 'rowne',
      },
      [{ id: 1, miesiac: '12', kwota: '1000', tryb: 'obnizRate' }],
    );

    expect(query.get('kwota')).toBe('400000');
    expect(JSON.parse(query.get('nadplaty') ?? '[]')).toEqual([
      { miesiac: 12, kwota: 1000, tryb: 'obnizRate' },
    ]);
  });
});
