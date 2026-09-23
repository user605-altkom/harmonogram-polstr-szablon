# Zadania: Kalkulator harmonogramu spłat

**Źródła**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/harmonogram-api.md`, `quickstart.md`

**Strategia**: najpierw testy domeny i minimalne obliczenie rat, następnie zmienne
wskaźniki, nadpłaty, API i ekran. Faza 1 Setup pozostaje pusta, ponieważ szkielet
Next.js, Vitest i dane wskaźników już istnieją.

## Faza 1: Setup

**Cel**: wykorzystać istniejący szkielet projektu bez dodawania zależności.

Brak zadań. Repozytorium ma już konfigurację Next.js, TypeScript strict, Tailwind,
Vitest, katalogi źródłowe, dane przykładowe i test smoke.

---

## Faza 2: Foundational

**Cel**: przygotować wspólne typy domenowe, granice danych i konwencję testów.

- [X] T001 [P] Uzupełnić typy `ParametryKredytu`, `WpisSerii`, `Nadplata`, `RataHarmonogramu` i `Harmonogram` w `src/domena/harmonogram.ts`, zachowując kwoty jako całkowite grosze oraz warianty `rowne`/`malejace`, `POLSTR_1M`/`WIBOR_3M` i `obnizRate`/`skrocOkres`.
- [X] T002 [P] Rozszerzyć adapter `src/dane/wskazniki.ts` o jawny typ serii i funkcję przekazywania serii do domeny bez modyfikowania plików `dane/*.json`.
- [X] T003 [P] Przygotować w `tests/smoke.test.ts` wspólne fabryki parametrów oraz sztucznych serii używane przez testy domeny, bez usuwania istniejących testów danych i strefy czasowej.
- [X] T004 Usunąć test szkieletu oczekujący błędu „nie zaimplementowano” z `tests/smoke.test.ts` dopiero wtedy, gdy pierwsza implementacja domeny będzie gotowa do zastąpienia go testem zachowania.

**Punkt kontrolny**: typy domeny i dane wejściowe są ustalone, a `npm test` nadal przechodzi po zmianach testów.

---

## Faza 3: Historia użytkownika 1 - Obliczenie harmonogramu (Priorytet: P1) MVP

**Cel**: dla poprawnych parametrów zwrócić raty równe i malejące, odsetki oraz saldo końcowe.

**Test niezależny**: test domeny dla 400 000 zł, 300 rat, stopy 3,55% + 2,11 pp
potwierdza pierwszą ratę 2 494,72 zł z tolerancją 0,05 zł, a suma kapitału
wynosi 400 000,00 zł i saldo końcowe wynosi 0,00 zł.

### Testy przed implementacją

- [X] T005 [P] [US1] Dodać test liczby kontrolnej rat równych w `tests/smoke.test.ts`: pierwsza rata około 249472 grosze, ostatnia rata wyrównująca zgodnie z `BRIEF.md`, suma kapitału równa kwocie kredytu.
- [X] T006 [P] [US1] Dodać test rat malejących w `tests/smoke.test.ts`: część kapitałowa jest zgodna z planem, raty nie rosną, a saldo końcowe wynosi zero.
- [X] T007 [P] [US1] Dodać test zaokrągleń w `tests/smoke.test.ts`: suma `kapitalGr` po wszystkich ratach równa się `kwotaGr`, a ostatnia rata nie tworzy ujemnego salda.

### Implementacja

- [X] T008 [US1] Zaimplementować walidację parametrów domeny i daty pierwszej raty w `src/domena/harmonogram.ts`, odrzucając kwotę niedodatnią, liczbę rat niebędącą dodatnią liczbą całkowitą, ujemną marżę i niepoprawną datę.
- [X] T009 [US1] Zaimplementować wybór stałej serii wskaźnika przekazanej do domeny oraz obliczanie odsetek jako saldo razy roczna stopa okresu podzielona przez 12 w `src/domena/harmonogram.ts`.
- [X] T010 [US1] Zaimplementować raty równe i malejące w `src/domena/harmonogram.ts`, zaokrąglając kwoty do grosza w jednym miejscu i wyrównując ostatnią ratę do salda.
- [X] T011 [US1] Zwracać z `src/domena/harmonogram.ts` kompletne `Harmonogram` z numerem, datą, kapitałem, odsetkami, ratą, saldem, sumą odsetek i podsumowaniem pierwszej oraz ostatniej raty.

**Punkt kontrolny**: historia US1 działa niezależnie, `npm test` i `npm run typecheck` przechodzą, a liczba kontrolna jest zgodna z tolerancją.

---

## Faza 4: Historia użytkownika 2 - Zmiany wskaźnika (Priorytet: P1)

**Cel**: obsłużyć POLSTR 1M i WIBOR 3M według serii wartości obowiązujących od dat rat.

**Test niezależny**: sztuczna seria z jedną zmianą stopy daje inną kwotę odsetek
po dacie zmiany, a brak nowego wpisu używa ostatniej znanej wartości.

### Testy przed implementacją

- [X] T012 [P] [US2] Dodać test zmiany POLSTR 1M w trakcie spłaty w `tests/smoke.test.ts`, sprawdzając nową stopę od raty przypadającej na datę wpisu.
- [X] T013 [P] [US2] Dodać test WIBOR 3M w `tests/smoke.test.ts`, sprawdzając utrzymanie ostatniej znanej wartości pomiędzy wpisami i po ostatnim wpisie serii.
- [X] T014 [P] [US2] Dodać test braku wpisu wskaźnika przed pierwszą ratą w `tests/smoke.test.ts`, oczekując jawnego błędu domeny.

### Implementacja

- [X] T015 [US2] Zaimplementować deterministyczne wyszukiwanie ostatniego `WpisSerii`, którego `od` nie jest późniejsze niż data raty, w `src/domena/harmonogram.ts`.
- [X] T016 [US2] Przekazać serie POLSTR 1M i WIBOR 3M z `src/dane/wskazniki.ts` do wywołania domeny oraz zachować ostatnią wartość po końcu serii.
- [X] T017 [US2] Zaktualizować testy danych w `tests/smoke.test.ts`, aby potwierdzały kontrakt serii używany przez domenę bez edycji `dane/polstr-1m.json` i `dane/wibor-3m.json`.

**Punkt kontrolny**: obie serie wskaźników i zmiana stopy są testowalne niezależnie od API oraz ekranu.

---

## Faza 5: Historia użytkownika 3 - Nadpłaty (Priorytet: P2)

**Cel**: uwzględnić nadpłaty po regularnej racie w trybie obniżenia raty albo skrócenia okresu.

**Test niezależny**: identyczny kredyt z nadpłatą ma niższe saldo; tryb `obnizRate`
ma niższe raty od kolejnego miesiąca, a `skrocOkres` zachowuje ratę i kończy się wcześniej.

### Testy przed implementacją

- [X] T018 [P] [US3] Dodać test nadpłaty `obnizRate` w `tests/smoke.test.ts`, sprawdzając kolejność regularna rata, potem nadpłata, przeliczenie raty od następnego miesiąca i zachowany termin końcowy.
- [X] T019 [P] [US3] Dodać test nadpłaty `skrocOkres` w `tests/smoke.test.ts`, sprawdzając zachowaną ratę równą i wcześniejsze zakończenie harmonogramu.
- [X] T020 [P] [US3] Dodać test nadpłaty większej niż saldo oraz nadpłaty po końcu okresu w `tests/smoke.test.ts`, sprawdzając brak ujemnego salda i jawny błąd nieprawidłowego miesiąca.

### Implementacja

- [X] T021 [US3] Zaimplementować walidację listy nadpłat w `src/domena/harmonogram.ts`, w tym dodatni miesiąc, dodatnią kwotę w groszach, dozwolony tryb i brak nadpłaty po zakończeniu okresu.
- [X] T022 [US3] Zastosować nadpłatę po regularnej racie oraz ograniczyć saldo do zera w `src/domena/harmonogram.ts`.
- [X] T023 [US3] Zaimplementować przeliczenie raty na pozostały okres dla `obnizRate` i zachowanie raty dla `skrocOkres` w `src/domena/harmonogram.ts`.
- [X] T024 [US3] Uzupełnić `RataHarmonogramu` o `nadplataGr` i zakończenie pętli po wcześniejszej spłacie w `src/domena/harmonogram.ts`.

**Punkt kontrolny**: oba tryby nadpłat przechodzą testy, suma kapitału i saldo końcowe pozostają poprawne.

---

## Faza 6: Historia użytkownika 4 - API, ekran i eksport wyniku (Priorytet: P2)

**Cel**: udostępnić wynik przez API i formularz z tabelą, podsumowaniem oraz eksportem CSV.

**Test niezależny**: poprawne żądanie zwraca kontrakt 200, błędne parametry 400,
a ekran pokazuje wynik i pozwala pobrać kompletny CSV.

### Testy przed implementacją

- [X] T025 [P] [US4] Dodać test parsowania błędnych parametrów route handlera w `tests/smoke.test.ts` lub wydzielonym `tests/api.test.ts`, oczekując statusu 400 i pola `blad` bez częściowego wyniku.
- [X] T026 [P] [US4] Dodać test kontraktu poprawnej odpowiedzi w `tests/api.test.ts`, sprawdzając status 200, pola podsumowania i wiersze tabeli zgodne z `contracts/harmonogram-api.md`.
- [X] T027 [P] [US4] Dodać test serializacji listy nadpłat w `tests/api.test.ts`, sprawdzając format parametru `nadplaty`, kwoty w złotych i tryby `obnizRate`/`skrocOkres`.
- [ ] T028 [P] [US4] Przygotować w `tests/page.test.tsx` test stanów ekranu: pusty wynik, ładowanie, błąd 400 i poprawny wynik, bez testowania obliczeń finansowych w React.

### Implementacja

- [X] T029 [US4] Rozszerzyć parsowanie query string i nadpłat w `app/api/harmonogram/route.ts`, konwertując złote na grosze i punkty procentowe na ułamki bez przenoszenia obliczeń do route handlera.
- [X] T030 [US4] Podłączyć `app/api/harmonogram/route.ts` do domeny i danych wskaźników, zwracając kontrakt 200 oraz błędy 400 opisane w `contracts/harmonogram-api.md`.
- [X] T031 [US4] Zdefiniować w `app/page.tsx` typy odpowiedzi API, stan formularza, stan żądania oraz funkcje `formatujZl`, budowania `URLSearchParams` i mapowania groszy na prezentację w złotych.
- [X] T032 [US4] Wydzielić w `app/page.tsx` jedyną funkcję kontaktu z backendem `pobierzHarmonogram` oraz wyraźnie oznaczony adapter mocka demonstracyjnego, który można usunąć bez zmiany komponentów widoku.
- [X] T033 [US4] Odtworzyć w `app/page.tsx` layout z `Harmonogram kredytu POLSTR/export/app/page.tsx`: ciemny motyw Nocturne, nagłówek z nazwą i opisem, tag wybranego wskaźnika, opcjonalny tag „Tryb demonstracyjny” oraz dwie kolumny panel formularza/wynik.
- [X] T034 [US4] Zaimplementować formularz w `app/page.tsx` z polami kwota, liczba rat, data pierwszej raty, marża, wskaźnik POLSTR/WIBOR i typ rat równych/malejących, wartościami domyślnymi, jednostkami i walidacją zakresów widocznych w eksporcie designu.
- [X] T035 [US4] Zaimplementować sekcję nadpłat zgodną z designem: licznik, przycisk „Dodaj nadpłatę” z ikoną, numer raty, kwota, wybór trybu, przycisk usuwania z etykietą ARIA i stan „Brak zaplanowanych nadpłat”.
- [X] T036 [US4] Zaimplementować stany ekranu: pusty wynik, ładowanie, sukces i błąd, z paskiem ładowania, komunikatem po polsku oraz `aria-live`; nie wyświetlać częściowego wyniku.
- [X] T037 [US4] Zaimplementować podsumowanie jako cztery zwarte pola: pierwsza rata z datą, ostatnia rata z datą, suma odsetek z liczbą rat oraz saldo końcowe z opisem; wyróżnić pierwszą ratę akcentem.
- [X] T038 [US4] Zaimplementować nagłówek tabeli z akcjami „Pierwsza rata”, „Ostatnia rata” i „Eksport CSV” oraz przewijanie kontenera do pierwszego i ostatniego wiersza.
- [X] T039 [US4] Zaimplementować tabelę z caption dla czytników ekranu, sticky headerem, kolumnami numer, data, kapitał, odsetki, rata, nadpłata i saldo, wyrównaniem liczb do prawej oraz przewijaniem poziomym i pionowym.
- [X] T040 [US4] Dodać eksport kompletnej tabeli do CSV po stronie przeglądarki, z nagłówkami, BOM dla polskich znaków, separatorem zgodnym z arkuszami i bez endpointu eksportu.
- [X] T041 [US4] Dopracować `app/page.tsx` pod kątem dostępności: `fieldset`/`legend`, `aria-invalid`, `aria-describedby`, semantyczne nagłówki, obsługa klawiatury, focus, kontrast i brak informacji przekazywanej wyłącznie kolorem.
- [X] T042 [US4] Dodać do `app/globals.css` tokeny Nocturne z eksportu `Harmonogram kredytu POLSTR/export/app/globals.css`, stany focus, animacje pojawiania i paska ładowania oraz `prefers-reduced-motion`, bez zależności od `_ds/` i bez importowania runtime design toola.

**Punkt kontrolny**: endpoint i ekran realizują kompletne MVP, mock jest wyraźnie wymienialny,
a CSV zawiera nagłówki i wszystkie wiersze wyniku.

---

## Faza 7: Polish i walidacja przekrojowa

**Cel**: potwierdzić gotowość MVP i zgodność z dokumentacją.

- [ ] T043 [P] Zaktualizować komentarze i nazwy domenowe po polsku w zmienionych plikach `src/domena/harmonogram.ts`, `src/dane/wskazniki.ts` i `app/api/harmonogram/route.ts`.
- [ ] T044 [P] Sprawdzić desktop, laptop, tablet i telefon dla `app/page.tsx`, w szczególności dwie kolumny, brak przepełnienia, sticky header, przewijanie tabeli, czytelność kwot i wygodę pól dotykowych.
- [ ] T045 [P] Sprawdzić wszystkie stany designu: brak wyniku, ładowanie z paskiem, błąd, sukces, pusta lista nadpłat, wynik demonstracyjny i brak danych tabeli.
- [X] T046 [P] Porównać implementację z `Harmonogram kredytu POLSTR/Harmonogram POLSTR.dc.html`, zachowując hierarchię, kontrast, tag wskaźnika, podsumowanie i akcje tabeli, ale bez kopiowania runtime `_ds/`.
- [X] T047 Uruchomić scenariusze z `specs/001-kalkulator-harmonogramu/quickstart.md` i poprawić rozbieżności między kontraktem a implementacją.
- [X] T048 Uruchomić `npm test`, `npm run typecheck`, `npm run lint` i `npm run build`; zapisać wynik kontroli przed PR.
- [ ] T049 Sprawdzić zgodność implementacji ze `spec.md`, `plan.md`, `data-model.md` i `contracts/harmonogram-api.md` przed utworzeniem PR.

---

## Zależności i kolejność wykonania

### Zależności faz

- Faza 1: istniejący szkielet; brak zadań do wykonania.
- Faza 2: musi zakończyć się przed każdą historią użytkownika.
- Faza 3: MVP domeny rat może rozpocząć się po Fazie 2.
- Faza 4: zależy od typów i bazowego obliczenia z Fazy 3.
- Faza 5: zależy od Fazy 3 i korzysta z mechanizmu stóp z Fazy 4.
- Faza 6: zależy od ukończenia domeny z Faz 3-5.
- Faza 7: zależy od wszystkich wybranych funkcji MVP.

### Zależności historii użytkownika

- US1: po Fazie 2, niezależna baza MVP.
- US2: po US1, bo rozszerza obliczenie o wybór wartości wskaźnika.
- US3: po US1 i US2, bo nadpłaty wykorzystują zmienną stopę oraz saldo.
- US4: po US1-US3, bo API i ekran prezentują pełny wynik z nadpłatami.

### Możliwości równoległe

- T001-T003 mogą być wykonane równolegle, ponieważ dotyczą różnych plików.
- T005-T007 mogą być napisane równolegle przed implementacją US1.
- T012-T014 mogą być napisane równolegle przed implementacją US2.
- T018-T020 mogą być napisane równolegle przed implementacją US3.
- T025-T028 mogą być napisane równolegle przed implementacją US4.
- T033-T035 mogą być wykonywane równolegle po przygotowaniu adaptera danych T031-T032.
- T037-T041 mogą być wykonywane równolegle, jeśli pracują na rozdzielnych komponentach lub sekcjach `app/page.tsx`.
- T042-T044 mogą być wykonane równolegle przed końcową walidacją.

## Przykład wykonania równoległego: US1

```text
T005: test liczby kontrolnej w tests/smoke.test.ts
T006: test rat malejących w tests/smoke.test.ts
T007: test zaokrągleń w tests/smoke.test.ts

Po uzyskaniu czerwonych testów:
T008-T011: implementacja domeny w src/domena/harmonogram.ts
```

## Strategia implementacji

### MVP pierwsze

1. Pominąć pustą Fazę 1.
2. Wykonać Fazę 2 i przygotować typy.
3. Wykonać Fazę 3 i zatrzymać się po działających ratach równych/malejących.
4. Zweryfikować liczbę kontrolną, testy i typecheck.
5. Następnie dodać zmiany wskaźnika, nadpłaty, API i ekran.

### Dostarczanie przyrostowe

1. US1: działający silnik rat jako pierwsza wartość demonstracyjna.
2. US2: zmienne POLSTR/WIBOR z testami zmian stopy.
3. US3: nadpłaty w dwóch jawnie określonych trybach.
4. US4: API, ekran i CSV.
5. Faza 7: responsywność, dostępność, quickstart, lint, typecheck, testy i build przed PR.

## Kryteria ukończenia

- Każde zadanie ma checkbox, identyfikator, właściwą etykietę historii lub brak etykiety dla zadań wspólnych oraz ścieżkę pliku.
- Testy domenowe są pisane przed implementacją i obejmują liczbę kontrolną.
- Design jest odwzorowany w `app/page.tsx`, a mock demonstracyjny jest wyraźnie oddzielony od adaptera `GET /api/harmonogram`.
- Ekran obsługuje pusty wynik, ładowanie, błąd i sukces oraz jest używalny na desktopie i telefonie.
- Formularz ma etykiety, focus, obsługę klawiatury i komunikaty dostępności.
- `npm test`, `npm run typecheck` i `npm run build` przechodzą przed zgłoszeniem gotowości.
- Suma kapitału jest równa kwocie kredytu, a saldo końcowe wynosi zero.
