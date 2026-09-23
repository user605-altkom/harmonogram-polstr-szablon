# Research: Kalkulator harmonogramu spłat

## Decyzja 1: Kwoty w groszach jako liczby całkowite

**Decyzja**: Domena przyjmuje i zwraca kwoty w groszach jako liczby całkowite.
Zaokrąglenie do grosza odbywa się w jednym miejscu podczas wyznaczania pozycji
harmonogramu, z wyrównaniem ostatniej raty.

**Uzasadnienie**: Eliminuje typowe błędy reprezentacji dziesiętnej i pozwala
bezpośrednio sprawdzić, że suma kapitału jest równa kwocie kredytu.

**Rozważane alternatywy**: Liczby zmiennoprzecinkowe w złotych odrzucono, bo
utrudniają kontrolę groszy. Biblioteka do arytmetyki dziesiętnej odrzucona, bo
MVP nie wymaga nowej zależności.

## Decyzja 2: Seria wskaźnika jest zależnością domeny

**Decyzja**: Funkcja obliczająca harmonogram otrzymuje serię wskaźnika jako
argument albo korzysta z cienkiego adaptera danych, a wybór wpisu następuje
według daty raty. Po ostatnim wpisie obowiązuje ostatnia znana wartość.

**Uzasadnienie**: Obliczenia pozostają deterministyczne i można testować zmianę
wskaźnika na małej, sztucznej serii bez zależności od plików JSON.

**Rozważane alternatywy**: Odczyt JSON bezpośrednio w domenie odrzucono jako
naruszenie zasady czystej domeny. Pobieranie danych z zewnętrznego serwisu jest
poza zakresem MVP.

## Decyzja 3: Nadpłata jest stosowana po racie miesiąca

**Decyzja**: W miesiącu nadpłaty najpierw księgowana jest regularna rata,
następnie nadpłata. W trybie „obniż ratę” rata jest przeliczana na pozostały
okres, a w trybie „skróć okres” pozostaje na dotychczasowym poziomie.

**Uzasadnienie**: Zasada jest jednoznaczna dla użytkownika i umożliwia osobne
testy obu trybów bez ukrytej kolejności operacji.

**Rozważane alternatywy**: Nadpłata przed ratą albo zastępująca ratę odrzucono,
bo zmieniałaby naliczanie odsetek w miesiącu bez wyraźnej potrzeby biznesowej.

## Decyzja 4: Obsługa błędów przez jawny kontrakt JSON

**Decyzja**: Niepoprawne parametry zwracają odpowiedź błędu z polem `blad` i
statusem 400. Poprawne obliczenie zwraca kompletne podsumowanie oraz tabelę.

**Uzasadnienie**: Formularz może pokazać komunikat bez zgadywania, czy wynik
jest częściowy. Kontrakt pozostaje prosty i zgodny z istniejącym route handlerem.

**Rozważane alternatywy**: Częściowy harmonogram odrzucono, ponieważ mógłby
zostać pomylony z poprawnym wynikiem. Dodatkowy system wyjątków HTTP nie jest
potrzebny w MVP.

## Decyzja 5: Testy domeny przed implementacją

**Decyzja**: Każda historia zmieniająca obliczenia zaczyna się od testu Vitest,
a kończy wspólnym uruchomieniem testów, typecheck i build.

**Uzasadnienie**: Liczba kontrolna i własności sum kapitału są najważniejszymi
sygnałami poprawności finansowej, a testy nie wymagają uruchamiania Next.js.

**Rozważane alternatywy**: Testy wyłącznie przez ekran odrzucono, bo utrudniają
lokalizację błędów i nie chronią bezpośrednio czystych funkcji domenowych.
