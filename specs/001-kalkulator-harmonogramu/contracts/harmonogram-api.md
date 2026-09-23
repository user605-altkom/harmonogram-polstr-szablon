# Kontrakt API harmonogramu

## Endpoint

`GET /api/harmonogram`

## Parametry query

| Parametr | Format | Wymagany | Znaczenie |
|---|---|---|---|
| `kwota` | dodatnia liczba w złotych | tak | kwota kredytu |
| `liczbaRat` | dodatnia liczba całkowita | tak | liczba rat |
| `marza` | nieujemna liczba w punktach procentowych | tak | marża banku |
| `wskaznik` | `POLSTR_1M` lub `WIBOR_3M` | tak | seria wskaźnika |
| `typRat` | `rowne` lub `malejace` | tak | sposób spłaty |
| `pierwszaRata` | `YYYY-MM-DD` | tak | data pierwszej raty |
| `nadplaty` | JSON zakodowany w query | nie | lista `{miesiac, kwota, tryb}` |

Parametr `kwota` jest podawany w złotych, a `marza` w punktach procentowych;
route handler konwertuje je na grosze i ułamki używane przez domenę.

## Odpowiedź sukcesu: 200

```json
{
  "raty": [
    {
      "numer": 1,
      "data": "2026-10-01",
      "kapitalGr": 123456,
      "odsetkiGr": 188667,
      "rataGr": 312123,
      "nadplataGr": 0,
      "saldoGr": 39876544
    }
  ],
  "sumaOdsetekGr": 12345678,
  "pierwszaRataGr": 312123,
  "ostatniaRataGr": 250000,
  "saldoKoncoweGr": 0
}
```

Kwoty odpowiedzi są w groszach jako liczby całkowite. Interfejs przelicza je
na złote tylko podczas prezentacji.

## Odpowiedź błędu danych: 400

```json
{
  "blad": "kwota: liczba dodatnia w złotych, np. 400000",
  "przyklad": "/api/harmonogram?kwota=400000&liczbaRat=300&marza=2.11&wskaznik=POLSTR_1M&typRat=rowne&pierwszaRata=2026-10-01"
}
```

Błąd nie zwraca częściowego harmonogramu. Komunikat wskazuje parametr lub
regułę, która nie została spełniona.

## Odpowiedź błędu obliczeń: 400

```json
{
  "blad": "opis błędu domeny"
}
```

## Zakres kontraktu

- Kontrakt nie obejmuje logowania, zapisu historii ani zewnętrznego importu.
- Eksport CSV jest funkcją ekranu i nie jest osobnym endpointem.
- Odpowiedź 501 ze szkieletem jest przejściowa i znika po implementacji domeny.
