import polstr1m from '../../dane/polstr-1m.json';
import wibor3m from '../../dane/wibor-3m.json';
import type { ParametryKredytu, WpisSerii } from '../domena/harmonogram';

export type { WpisSerii } from '../domena/harmonogram';

const SERIE: Record<ParametryKredytu['wskaznik'], WpisSerii[]> = {
  POLSTR_1M: polstr1m.wartosci,
  WIBOR_3M: wibor3m.wartosci,
};

/** Seria wartości wskaźnika z dane/*.json, uporządkowana rosnąco po dacie. */
export function seriaWskaznika(wskaznik: ParametryKredytu['wskaznik']): WpisSerii[] {
  return SERIE[wskaznik];
}
