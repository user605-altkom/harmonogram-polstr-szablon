# Quickstart walidacji: Kalkulator harmonogramu spłat

## Wymagania

- Node.js zgodny z `package.json` (wersja 22 lub nowsza)
- npm
- repozytorium z zainstalowanymi zależnościami

## Instalacja i kontrole

```powershell
npm install
npm test
npm run typecheck
npm run build
```

Oczekiwany rezultat: testy, typecheck i build kończą się kodem 0.

## Uruchomienie lokalne

```powershell
npm run dev
```

Otwórz `http://localhost:3000`. Sprawdź także endpoint z liczbą kontrolną:

```text
http://localhost:3000/api/harmonogram?kwota=400000&liczbaRat=300&marza=2.11&wskaznik=POLSTR_1M&typRat=rowne&pierwszaRata=2026-10-01
```

## Scenariusz 1: liczba kontrolna

1. Wprowadź kwotę 400 000 zł, 300 rat, marżę 2,11 pp i raty równe.
2. Użyj stałej serii wskaźnika 3,55% w teście domenowym.
3. Uruchom obliczenie.
4. Sprawdź pierwszą ratę około 2 494,72 zł z tolerancją 0,05 zł.
5. Sprawdź saldo końcowe 0,00 zł i sumę kapitału równą 400 000,00 zł.

## Scenariusz 2: zmiana wskaźnika

1. Użyj krótkiej sztucznej serii z dwiema wartościami obowiązującymi od
   różnych dat.
2. Oblicz harmonogram obejmujący datę zmiany.
3. Sprawdź, że odsetki po tej dacie używają nowej wartości.
4. Powtórz dla POLSTR 1M i WIBOR 3M zgodnie z częstotliwością serii.

## Scenariusz 3: nadpłaty

1. Oblicz harmonogram bez nadpłaty jako punkt odniesienia.
2. Dodaj nadpłatę po regularnej racie w wybranym miesiącu w trybie „obniż ratę”.
3. Sprawdź niższą ratę od kolejnego miesiąca i zachowany termin końcowy.
4. Powtórz w trybie „skróć okres”. Sprawdź zachowaną ratę i wcześniejsze saldo
   końcowe.

## Scenariusz 4: błędne dane i eksport

1. Wyślij żądanie z ujemną kwotą, niepoprawnym typem rat i błędną datą.
2. Sprawdź odpowiedź 400 z polem `blad` i bez częściowego harmonogramu.
3. W ekranie uruchom poprawne obliczenie i wybierz eksport CSV.
4. Sprawdź nagłówki, liczbę wierszy i zgodność kwot z tabelą na ekranie.

Szczegółowe pola wejścia i wyjścia są opisane w [kontrakcie API](contracts/harmonogram-api.md),
a reguły encji w [modelu danych](data-model.md).
