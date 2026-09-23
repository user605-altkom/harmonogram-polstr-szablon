# Model danych: Kalkulator harmonogramu spłat

## ParametryKredytu

Opis: wejściowe parametry jednego obliczenia.

| Pole | Typ / jednostka | Reguły |
|---|---|---|
| `kwotaGr` | liczba całkowita, grosze | większa od zera |
| `liczbaRat` | dodatnia liczba całkowita | określa maksymalną liczbę rat |
| `marza` | liczba, ułamek roczny | nieujemna; API konwertuje punkty procentowe |
| `typRat` | `rowne` albo `malejace` | dokładnie jeden wariant |
| `wskaznik` | `POLSTR_1M` albo `WIBOR_3M` | dokładnie jeden wariant |
| `pierwszaRata` | data `YYYY-MM-DD` | poprawna data |
| `nadplaty` | lista `Nadplata` | może być pusta |

## WpisSerii

Opis: wartość wskaźnika obowiązująca od określonego dnia.

| Pole | Typ / jednostka | Reguły |
|---|---|---|
| `od` | data `YYYY-MM-DD` | wpisy rosnąco po dacie |
| `stopa` | liczba, ułamek roczny | wartość wskaźnika, nie procent |

Dla daty raty wybierany jest ostatni wpis, którego `od` nie jest późniejsze od
daty raty. Po ostatnim wpisie używana jest ostatnia znana wartość.

## Nadplata

Opis: dodatkowa spłata kapitału przypisana do miesiąca harmonogramu.

| Pole | Typ / jednostka | Reguły |
|---|---|---|
| `miesiac` | dodatnia liczba całkowita | wskazuje numer raty/miesiąca |
| `kwotaGr` | liczba całkowita, grosze | większa od zera |
| `tryb` | `obnizRate` albo `skrocOkres` | dokładnie jeden wariant |

W miesiącu nadpłaty najpierw rozliczana jest regularna rata, a dopiero potem
nadpłata. Nadpłata nie może pozostawić ujemnego salda.

## RataHarmonogramu

Opis: pojedynczy wiersz wyniku.

| Pole | Typ / jednostka | Reguły |
|---|---|---|
| `numer` | dodatnia liczba całkowita | numer kolejny raty |
| `data` | data `YYYY-MM-DD` | data raty |
| `kapitalGr` | liczba całkowita, grosze | część kapitałowa regularnej raty |
| `odsetkiGr` | liczba całkowita, grosze | odsetki za okres |
| `rataGr` | liczba całkowita, grosze | kapitał + odsetki |
| `nadplataGr` | liczba całkowita, grosze | nadpłata po racie, domyślnie 0 |
| `saldoGr` | liczba całkowita, grosze | saldo po racie i nadpłacie |

## Harmonogram

Opis: wynik kompletnego obliczenia.

| Pole | Typ / jednostka | Reguły |
|---|---|---|
| `raty` | lista `RataHarmonogramu` | uporządkowana rosnąco po numerze |
| `sumaOdsetekGr` | liczba całkowita, grosze | suma `odsetkiGr` |
| `pierwszaRataGr` | liczba całkowita, grosze | `rataGr` pierwszego wiersza |
| `ostatniaRataGr` | liczba całkowita, grosze | `rataGr` ostatniego wiersza |
| `saldoKoncoweGr` | liczba całkowita, grosze | musi wynosić 0 |

## Reguły przejść

1. Saldo początkowe wynosi `kwotaGr`.
2. Dla każdego okresu wybierana jest stopa wskaźnika, dodawana jest marża,
   a odsetki są liczone jako saldo razy stopa roczna podzielona przez 12.
3. Do salda stosowana jest regularna część kapitałowa, następnie nadpłata.
4. W trybie `obnizRate` rata jest przeliczana na pozostały okres.
5. W trybie `skrocOkres` rata pozostaje na dotychczasowym poziomie, aż saldo
   osiągnie zero.
6. Ostatnia rata otrzymuje wyrównanie zaokrągleń, aby saldo końcowe wyniosło 0.
