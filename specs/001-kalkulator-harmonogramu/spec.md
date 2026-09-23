# Specyfikacja funkcji: Kalkulator harmonogramu spłat

**Feature Branch**: `spec-mvp`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: Kalkulator harmonogramu spłat kredytu hipotecznego ze zmiennym oprocentowaniem opartym na POLSTR 1M lub WIBOR 3M, obsługujący raty równe i malejące oraz nadpłaty.

## Clarifications

### Session 2026-09-23

- Q: Czy nadpłata ma być księgowana po regularnej racie danego miesiąca? → A: Tak. Najpierw regularna rata, potem nadpłata; zmieniony harmonogram obowiązuje od następnego miesiąca.
- Q: W trybie „obniż ratę” po nadpłacie jak należy wyznaczać kolejne raty? → A: Przeliczyć ratę równą na pozostały okres, zachowując pierwotny termin końcowy kredytu.
- Q: W trybie „skróć okres” czy należy zachować wysokość raty obowiązującą przed nadpłatą? → A: Tak. Rata równa pozostaje na dotychczasowym poziomie, a harmonogram kończy się wcześniej.

## User Scenarios & Testing

### Historia użytkownika 1 - Obliczenie harmonogramu (Priorytet: P1)

Jako doradca kredytowy chcę podać podstawowe parametry kredytu i otrzymać kompletny harmonogram spłat, aby pokazać klientowi wysokość oraz strukturę rat.

**Dlaczego ten priorytet**: Jest to podstawowa wartość kalkulatora i samodzielnie działający zakres MVP.

**Test niezależny**: Podanie poprawnych parametrów i uruchomienie obliczenia zwraca harmonogram od pierwszej do ostatniej raty oraz sumę odsetek.

**Scenariusze akceptacji**:

1. **Mając** kwotę kredytu, liczbę rat, datę pierwszej raty, marżę i wskaźnik, **gdy** użytkownik wybierze raty równe i uruchomi obliczenie, **wtedy** otrzyma numer, datę, kapitał, odsetki, ratę i saldo dla każdej raty.
2. **Mając** te same parametry i raty malejące, **gdy** użytkownik uruchomi obliczenie, **wtedy** część kapitałowa rat pozostanie zgodna z przyjętym planem spłaty, a wysokość rat będzie malała wraz ze spadkiem odsetek.
3. **Mając** stały wskaźnik 3,55%, kwotę 400 000 zł, 300 rat równych i marżę 2,11 pp, **gdy** użytkownik obliczy harmonogram, **wtedy** pierwsza rata wyniesie około 2 494,72 zł, z tolerancją 0,05 zł.

### Historia użytkownika 2 - Uwzględnienie zmian wskaźnika (Priorytet: P1)

Jako doradca chcę wybrać POLSTR 1M albo WIBOR 3M i uwzględnić zmiany wartości wskaźnika w kolejnych okresach, aby wynik odzwierciedlał zmienne oprocentowanie.

**Dlaczego ten priorytet**: Obsługa obu wskaźników i ich zmienności jest główną różnicą tego kalkulatora względem kalkulatora stałej stopy.

**Test niezależny**: Obliczenie na sztucznej serii z co najmniej jedną zmianą wskaźnika pozwala sprawdzić, że późniejsze odsetki wykorzystują nową wartość.

**Scenariusze akceptacji**:

1. **Mając** serię POLSTR 1M z nową wartością od dnia raty, **gdy** harmonogram obejmie ten dzień, **wtedy** oprocentowanie kolejnego okresu użyje nowej wartości.
2. **Mając** serię WIBOR 3M, **gdy** przez trzy miesiące nie ma nowego wpisu, **wtedy** używana jest ostatnia obowiązująca wartość.
3. **Mając** ostatni dostępny wpis serii, **gdy** harmonogram wykracza poza jego datę, **wtedy** ostatnia znana wartość obowiązuje do końca obliczeń.

### Historia użytkownika 3 - Nadpłata kredytu (Priorytet: P2)

Jako kredytobiorca chcę wprowadzić nadpłaty i wybrać sposób ich rozliczenia, aby porównać wpływ nadpłaty na ratę albo czas spłaty.

**Dlaczego ten priorytet**: Nadpłaty są wymaganym elementem MVP, ale mogą być dodane po podstawowym obliczeniu harmonogramu.

**Test niezależny**: Dla identycznego kredytu obliczenie z nadpłatą daje niższe saldo niż obliczenie bez niej, a wybrany tryb wpływa na ratę lub liczbę rat.

**Scenariusze akceptacji**:

1. **Mając** nadpłatę przypisaną do miesiąca i tryb „obniż ratę”, **gdy** użytkownik obliczy harmonogram, **wtedy** najpierw zostanie zaksięgowana regularna rata, następnie nadpłata zmniejszy saldo, a rata równa zostanie przeliczona na pozostały okres od kolejnego miesiąca, bez zmiany terminu końcowego.
2. **Mając** nadpłatę i tryb „skróć okres”, **gdy** użytkownik obliczy harmonogram, **wtedy** najpierw zostanie zaksięgowana regularna rata, następnie nadpłata zmniejszy saldo, rata równa pozostanie na dotychczasowym poziomie, a kredyt zostanie spłacony wcześniej.
3. **Mając** nadpłatę większą niż bieżące saldo, **gdy** użytkownik uruchomi obliczenie, **wtedy** saldo nie spadnie poniżej zera, a harmonogram zakończy się bez ujemnej kwoty.

### Historia użytkownika 4 - Odczyt i eksport wyniku (Priorytet: P2)

Jako doradca chcę szybko odczytać najważniejsze podsumowanie i wyeksportować tabelę, aby przekazać wynik klientowi lub wykorzystać go w dalszej pracy.

**Dlaczego ten priorytet**: Czytelny wynik i eksport są niezbędne do praktycznego użycia obliczeń.

**Test niezależny**: Po udanym obliczeniu można odczytać ratę pierwszą, ratę ostatnią i sumę odsetek oraz pobrać plik CSV z tabelą.

**Scenariusze akceptacji**:

1. **Mając** poprawny wynik, **gdy** użytkownik go przegląda, **wtedy** widzi ratę pierwszą, ratę ostatnią, sumę odsetek i tabelę rat.
2. **Mając** poprawny wynik, **gdy** użytkownik wybierze eksport CSV, **wtedy** pobrany plik zawiera nagłówki oraz wszystkie raty z tabeli.
3. **Mając** niepoprawne dane wejściowe, **gdy** użytkownik uruchomi obliczenie, **wtedy** otrzyma komunikat wskazujący błąd i nie otrzyma mylącego częściowego harmonogramu.

### Przypadki brzegowe

- Kwota kredytu, liczba rat lub marża poniżej zera są odrzucane.
- Liczba rat musi być dodatnią liczbą całkowitą.
- Data pierwszej raty musi być poprawną datą w formacie `YYYY-MM-DD`.
- Lista nadpłat może być pusta; nadpłata musi mieć dodatnią kwotę i poprawny miesiąc.
- Nadpłata przypadająca po zakończeniu harmonogramu jest odrzucana albo zgłaszana jako błąd, bez zmiany wyniku.
- Ostatnia rata może różnić się od wcześniejszych przez wyrównanie zaokrągleń, ale saldo po niej musi wynosić zero.
- Brak wpisu wskaźnika przed pierwszą ratą jest błędem danych wejściowych; brak wpisu po ostatnim znanym wpisie wykorzystuje ostatnią znaną wartość.
- Kwota odsetek w okresie jest liczona jako saldo pomnożone przez roczną stopę okresu podzieloną przez 12; nie są składane dzienne stawki wstecz.

## Requirements

### Wymagania funkcjonalne

- **FR-001**: System MUST przyjąć kwotę kredytu, liczbę rat, datę pierwszej raty i marżę banku.
- **FR-002**: System MUST pozwolić wybrać raty równe albo malejące.
- **FR-003**: System MUST pozwolić wybrać POLSTR 1M albo WIBOR 3M.
- **FR-004**: System MUST wyznaczać oprocentowanie okresu jako wartość wskaźnika powiększoną o marżę.
- **FR-005**: System MUST stosować zmianę POLSTR 1M co miesiąc w dniu raty oraz zmianę WIBOR 3M co kwartał zgodnie z dostarczoną serią wartości.
- **FR-006**: System MUST stosować ostatnią znaną wartość wskaźnika po ostatnim wpisie serii.
- **FR-007**: System MUST obliczać odsetki proste za okres bez kapitalizacji dziennych stawek w ramach miesiąca.
- **FR-008**: System MUST zaokrąglać kwoty do grosza i wyrównać ostatnią ratę tak, aby suma części kapitałowych była równa kwocie kredytu.
- **FR-009**: System MUST przyjąć listę nadpłat zawierającą miesiąc, kwotę i tryb „obniż ratę” albo „skróć okres”.
- **FR-010**: System MUST uwzględnić nadpłaty w saldzie oraz zastosować wybrany tryb dalszej spłaty.
- **FR-010a**: System MUST zaksięgować w miesiącu nadpłaty najpierw regularną ratę, a następnie nadpłatę; zmiana harmonogramu MUST obowiązywać od kolejnego miesiąca.
- **FR-010b**: W trybie „obniż ratę” system MUST przeliczyć ratę równą na pozostały okres po nadpłacie i zachować pierwotny termin końcowy kredytu.
- **FR-010c**: W trybie „skróć okres” system MUST zachować ratę równą obowiązującą przed nadpłatą i zakończyć harmonogram po wcześniejszej spłacie salda.
- **FR-011**: System MUST zwrócić dla każdej raty numer, datę, część kapitałową, część odsetkową, ratę i saldo po spłacie.
- **FR-012**: System MUST zwrócić sumę odsetek za cały okres oraz umożliwić odczyt raty pierwszej i ostatniej.
- **FR-013**: System MUST umożliwić użytkownikowi uruchomienie obliczenia po wypełnieniu formularza parametrów.
- **FR-014**: System MUST prezentować błędy parametrów w sposób zrozumiały i nie wyświetlać niepełnego wyniku jako poprawnego.
- **FR-015**: System MUST umożliwić eksport kompletnej tabeli rat do pliku CSV po stronie użytkownika.
- **FR-016**: System MUST zachować poprawność kwot po zaokrągleniu: suma części kapitałowych nie może różnić się od kwoty kredytu.

### Kluczowe encje

- **Parametry kredytu**: kwota, liczba rat, data pierwszej raty, marża, wybrany wskaźnik i typ rat.
- **Seria wskaźnika**: nazwa wskaźnika oraz uporządkowane wartości obowiązujące od wskazanych dat.
- **Nadpłata**: miesiąc wystąpienia, kwota oraz tryb wpływu na dalszą spłatę.
- **Rata**: numer, data, część kapitałowa, część odsetkowa, łączna kwota raty i saldo po spłacie.
- **Harmonogram**: uporządkowana lista rat, suma odsetek oraz podsumowanie pierwszej i ostatniej raty.

## Success Criteria

### Mierzalne rezultaty

- **SC-001**: Dla liczby kontrolnej z `BRIEF.md` pierwsza rata wynosi 2 494,72 zł z tolerancją 0,05 zł.
- **SC-002**: Dla każdego poprawnego zestawu parametrów suma części kapitałowych harmonogramu jest równa kwocie kredytu z dokładnością do jednego grosza, a saldo końcowe wynosi 0,00 zł.
- **SC-003**: Użytkownik może przejść od wypełnienia formularza do odczytania pierwszej raty, ostatniej raty i sumy odsetek w jednym przebiegu bez ręcznych obliczeń.
- **SC-004**: Dla serii zawierającej zmianę wskaźnika wynik odsetek po dacie zmiany różni się od wyniku dla serii stałej, zgodnie z nową wartością.
- **SC-005**: Nadpłata obniżająca ratę zmniejsza kolejne raty, a nadpłata skracająca okres kończy harmonogram wcześniej niż identyczny kredyt bez nadpłaty.
- **SC-006**: Eksport CSV zawiera wszystkie wiersze tabeli i pola wymagane do odtworzenia prezentowanego harmonogramu.
- **SC-007**: Każda niepoprawna wartość wejściowa daje komunikat błędu zamiast wyniku częściowego lub ujemnego salda.

## Assumptions

- Użytkownikiem jest pojedynczy doradca lub kredytobiorca; MVP nie obejmuje logowania, kont ani zapisywania historii.
- Dane POLSTR 1M i WIBOR 3M są dostarczone jako przykładowe serie i nie są modyfikowane w ramach tej funkcji.
- Wartość wskaźnika na okres jest pobierana wprost z serii; składanie dziennych stawek POLSTR jest poza zakresem MVP.
- Odsetki dotyczą miesięcznego okresu rozliczeniowego i są liczone według reguły z `BRIEF.md`.
- Kwoty prezentowane użytkownikowi są w złotych z dwoma miejscami po przecinku, a obliczenia zachowują dokładność groszową.
- Eksport CSV odbywa się lokalnie po stronie użytkownika i nie wymaga wysyłania danych poza aplikację.
- Wsparcie dla urządzeń mobilnych, RRSO, opłat dodatkowych, wcześniejszych prowizji i rekompensat nie należy do MVP.
