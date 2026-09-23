# Konstytucja projektu Harmonogram POLSTR

## Core Principles

### I. Domena pozostaje czysta
Logika obliczeń musi znajdować się w `src/domena/` jako czyste funkcje TypeScript.
Kod domenowy nie może zależeć od Reacta, Next.js, I/O ani zegara systemowego.
Każda funkcja domenowa musi być deterministyczna i możliwa do przetestowania
niezależnie od interfejsu użytkownika.

### II. Pieniądze i zaokrąglenia są jawne
Kwoty muszą być reprezentowane w groszach jako liczby całkowite albo według jednej
wyraźnie udokumentowanej konwencji. Zaokrąglenie musi odbywać się w jednym,
ustalonym miejscu. Harmonogram musi zapewniać, że suma spłat kapitału po
zaokrągleniach jest równa kwocie kredytu.

### III. Test najpierw
Każda zmiana logiki obliczeń musi mieć test w katalogu `tests/`, napisany przed
implementacją. Testy domeny muszą obejmować liczby kontrolne i przypadki graniczne,
w szczególności raty równe, raty malejące, zmianę wskaźnika i nadpłaty.

### IV. Warstwy mają wyraźne odpowiedzialności
Moduł danych w `src/dane/` udostępnia serie wskaźników zaimportowane z plików
JSON. Route handler `app/api/harmonogram/route.ts` może parsować parametry
i wywoływać domenę, ale nie może zawierać obliczeń. Ekran `app/page.tsx` pobiera
dane przez API i nie powiela logiki domenowej.

### V. Prostota i brak nieuzasadnionych zależności
Implementacja MVP musi używać istniejącego stosu Next.js, TypeScript, Tailwind
i Vitest. Nowa zależność wymaga uzasadnienia w planie lub PR. Rozwiązanie ma
realizować wymagania MVP bez przedwczesnych abstrakcji i funkcji spoza zakresu.

## Ograniczenia techniczne

Projekt używa Next.js App Router i TypeScript strict. Dane wskaźników są
odczytywane z istniejących plików `dane/*.json`; tych plików nie wolno zmieniać
bez wyraźnego polecenia. Dokumenty, komentarze w kodzie, nazwy domenowe
i komunikaty commitów są pisane po polsku. Interfejs nie używa bibliotek UI.

## Proces wytwarzania

Praca przebiega fazami opisanymi w `tasks.md`. Każda faza ma osobną gałąź,
mały commit i PR. Po zakończeniu fazy praca zatrzymuje się do czasu przeglądu.
Przed uznaniem fazy za gotową muszą przejść `npm test`, `npm run typecheck`
i `npm run build`. Zmiany implementacyjne są wykonywane według kolejności:
test, implementacja, walidacja, review.

## Governance

Ta konstytucja jest nadrzędna wobec lokalnych praktyk, chyba że późniejsza
decyzja projektowa jawnie ją zmieni. Zmiana konstytucji wymaga aktualizacji
wersji, daty, raportu wpływu oraz uzasadnienia w PR. Wersja jest zgodna z semantyką:
MAJOR oznacza niezgodną zmianę zasad, MINOR dodanie lub istotne rozszerzenie
zasady, a PATCH doprecyzowanie bez zmiany znaczenia. Każdy PR musi uwzględniać
zgodność z konstytucją, a naruszenie zasady wymaga jawnego uzasadnienia.

**Version**: 1.0.0 | **Ratified**: 2026-09-23 | **Last Amended**: 2026-09-23
