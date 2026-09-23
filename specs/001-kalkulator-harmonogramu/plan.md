# Implementation Plan: Kalkulator harmonogramu spłat

**Branch**: `spec-mvp` | **Date**: 2026-09-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-kalkulator-harmonogramu/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Funkcja oblicza harmonogram spłat kredytu hipotecznego dla POLSTR 1M i WIBOR 3M,
rat równych i malejących oraz nadpłat. Obliczenia pozostają w czystym module
domenowym, który pracuje na kwotach w groszach i otrzymuje serie wskaźników jako
dane wejściowe. Route handler waliduje query string i mapuje go na typy domenowe,
a ekran prezentuje wynik oraz generuje CSV po stronie przeglądarki.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.9, Node.js >=22

**Primary Dependencies**: Next.js 16 App Router, React 19, Tailwind CSS 4, Vitest 4

**Storage**: Brak trwałego storage; serie wskaźników z istniejących plików JSON

**Testing**: Vitest dla domeny i danych; typecheck i production build jako bramki

**Target Platform**: Aplikacja webowa uruchamiana lokalnie i na Vercel

**Project Type**: Web application z route handlerem API

**Performance Goals**: Harmonogram do 1 000 rat i typowej listy nadpłat oblicza się
lokalnie w jednym żądaniu bez zauważalnego oczekiwania dla użytkownika.

**Constraints**: Kwoty w groszach; jedno miejsce zaokrągleń; brak nowych
zależności; domena bez React, Next.js, I/O i czasu systemowego; dane `dane/*.json`
nie są modyfikowane.

**Scale/Scope**: MVP dla pojedynczego użytkownika, jeden formularz, jeden
harmonogram na żądanie, bez logowania, historii, RRSO i opłat dodatkowych.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- PASS: obliczenia będą w czystych funkcjach `src/domena/`, bez zależności od UI
  i I/O.
- PASS: wszystkie kwoty domenowe będą liczbami całkowitymi w groszach, a
  wyrównanie końcowe zapewni sumę kapitału równą kwocie kredytu.
- PASS: każda historia zmieniająca obliczenia otrzyma test Vitest z liczbą
  kontrolną lub asercją zachowania; test powstaje przed implementacją.
- PASS: `src/dane/` pozostaje adapterem do istniejących JSON-ów, route handler
  nie będzie liczył, a `app/page.tsx` nie będzie powielał domeny.
- PASS: plan nie dodaje zależności ani nie rozszerza MVP o funkcje spoza zakresu.

## Project Structure

### Documentation (this feature)

```text
specs/001-kalkulator-harmonogramu/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
app/
├── page.tsx                         # formularz, wynik i eksport CSV
└── api/harmonogram/route.ts         # walidacja query i wywołanie domeny
src/
├── domena/harmonogram.ts             # typy i czyste obliczenia
└── dane/wskazniki.ts                 # adapter serii z dane/*.json
tests/
└── smoke.test.ts                     # istniejące testy danych i szkielet domeny
dane/
├── polstr-1m.json
└── wibor-3m.json
```

**Structure Decision**: Zachowujemy istniejącą strukturę pojedynczej aplikacji
Next.js. Domena, dane, API i ekran mają osobne odpowiedzialności zgodnie z
konstytucją; testy pozostają w `tests/` i obejmują domenę oraz dane.

## Complexity Tracking

Brak naruszeń konstytucji wymagających dodatkowej złożoności.

## Kolejność realizacji

1. Rozszerzyć typy domenowe o serię wskaźnika, nadpłaty i wynik raty.
2. Dodać testy domeny: rata równa z liczbą kontrolną, rata malejąca, zmiana
  wskaźnika, oba tryby nadpłaty oraz sumy kapitału.
3. Zaimplementować walidację parametrów, daty rat i wybór wartości wskaźnika.
4. Zaimplementować obliczenia rat, zaokrąglanie i wyrównanie ostatniej raty.
5. Podłączyć route handler do domeny i opisać kontrakt błędów oraz odpowiedzi.
6. Podłączyć ekran formularza, podsumowanie, tabelę i eksport CSV.
7. Uruchomić testy, typecheck, lint i build; sprawdzić liczbę kontrolną lokalnie.
