# Odczyt zapytania ze skanowanego PDF

W Workspace przycisk **Dołącz PDF zapytania** przyjmuje pojedynczy PDF do 2 MB
oraz 10 stron, bez hasła. Odczyt nie wymaga połączenia komputera. Załączenie PDF
przełącza wiadomość w analizę dokumentu; nie wywołuje lokalnego wykonawcy.

`/api/workspace/document-plan` wymaga prywatnego Workspace. Waliduje limit ciała,
kanoniczny Base64, nagłówek i strukturę PDF oraz rzeczywistą liczbę stron przez
pdf-lib. PDF jest renderowany przez PDF.js do obrazów stron. Dostawca modelu otrzymuje
obrazy całości i powiększenia, bez nazwy źródłowego pliku.
Model: `NAVIMIND_DOCUMENT_MODEL`, domyślnie `gpt-4.1`; istniejący klucz modelu.
Nie zapisujemy źródłowego dokumentu ani jego treści w logach aplikacji lub repo.
Dokument jest przekazywany do dostawcy modelu, o czym informuje formularz.

Odpowiedź ma sprawdzany schemat do 20 pozycji. Zachowuje wymiary produktu,
ilości, typ, otwieranie, kolory, liczbę szyb, Ug, profil odniesienia, wyposażenie,
listwę transportową, niejasności i wskazanie źródła na stronie przesłanego PDF.
Brak danych oznacza null oraz potrzebę wyjaśnienia; duplikaty pozycji lub źródła
z nieistniejących stron są odrzucane. Wynik to `technical_draft`,
`executed: false`, `sales_review_required: true`.

Reguła pomiarowa użytkownika może rozdzielić wysokość drzwi i opcjonalną listwę
transportową. Nie kodujemy na stałe wysokości z konkretnej oferty ani nie
odejmujemy 30 mm od każdego odczytanego wymiaru. Nie wolno utożsamiać wymiarów
szkła z gabarytem drzwi lub Uw/Ud z Ug. Dane dotyczące marki nie potwierdzają
równoważności zamiennika. Treść kontraktu i dopiski produkcyjne nie upoważniają
do wysyłania, zamawiania lub uruchamiania produkcji.

Przykład testowy instrukcji użytkownika: `Odczytaj pozycje z PDF. W pozycji 3
wysokość samych drzwi wynosi 2050 mm; dodatkowe 30 mm to opcjonalna listwa do
transportu. Oddziel te wartości. Nie wykonuj konfiguracji.` Ten przykład jest
instrukcją do testu, nie wbudowanym wynikiem ekstrakcji.

Czat pokazuje odczyt modelu oraz źródła. Nie jest to niezależne potwierdzenie
poprawności OCR. Domyślne hasło w umowie lub znak akceptacji przy pozycji nie
stanowi autoryzacji działań. Na tym etapie trzeba sprawdzić specyfikację przed
podłączeniem do katalogu i GUI. Przepływ nie wykonuje jeszcze automatycznie
całego zadania PDF → konfigurator → oferta na Pulpicie.

PDF i obraz są wzajemnie wykluczającymi się załącznikami. Po wysłaniu historia
zachowuje nazwę i wynik odczytu, nie kopiuje Base64 pliku do kolejnych wiadomości.
Po błędzie załącznik zostaje przywrócony do ponowienia. Odczyty dłuższe niż limit
historii są zastępowane jawną informacją o braku pełnych danych, zamiast cicho
udawać kompletną specyfikację dla wykonawcy. Odświeżenie usuwa stan karty.

Testy sprawdzają kontrakt PDF, strony, walidację wyniku, zachowanie wymiaru i
listwy, brak akcji oraz przekazanie oryginalnego PDF do atrapy API. Nie dowodzą
jakości odczytu rzeczywistych skanów; to sprawdzamy na dokumencie użytkownika.


## Odczyt obrazów stron po błędach na skanie

Poprzedni przebieg z plikiem PDF i audytem kandydata nie odczytał poprawnie
rzeczywistego dokumentu. Przekazany przez użytkownika wynik pominął pozycję,
podał błędne wymiary i otwieranie. Nie uznajemy tego za udany odczyt.

Nowy przebieg renderuje każdą fizyczną stronę przez PDF.js i natywny canvas.
Limit obrazu to 2400 px dłuższego boku, skala do 3. Model rozpoznaje orientację
na obrazach; Sharp obraca rzeczywiste piksele, nie tylko metadane PDF.
Dla każdej strony powstaje całość oraz dwie połówki z nakładaniem 12%:
lewa/prawa dla poziomej strony, górna/dolna dla pionowej. Powiększenia nie są
osobnymi produktami. Render i powiększenia pozostają wyłącznie w pamięci.

Każda strona ma dwa osobne odczyty modelu. Każdy przebieg klasyfikuje stronę
jako products, non_product lub unreadable. Czytelna umowa bez specyfikacji nie
blokuje odczytanych produktów; strona nieczytelna wymaga sprawdzenia. Drugi otrzymuje wyłącznie źródło
i aktualną instrukcję użytkownika, bez kandydata i bez wcześniejszych odpowiedzi
czatu. Powiększenia są w nim pokazane przed widokiem całości. Poprzednie
wskazówki trzeba zawrzeć w bieżącej wiadomości; nie pobieramy ich automatycznie
z historii. Zapobiega to kopiowaniu starej, błędnej specyfikacji.

Porównanie jest wykonywane w kodzie: liczba i numery pozycji, ilości, rodzaj,
wymiary, listwa, otwieranie, barwy, liczba szyb, Ug i profil odniesienia.
Pominięta/dodatkowa pozycja lub rozbieżność danych daje review. Kod nie podmienia
wartości na odczyt kontrolny ani na oczekiwany wynik testu. Zapis page_inventory
zachowuje liczbę znalezionych pozycji w obu przebiegach dla każdej strony.
Zgodne odczyty tego samego modelu mogą nadal popełnić ten sam błąd; to nie jest
niezależne potwierdzenie prawdy. Cała oferta nadal wymaga sprawdzenia handlowca.
Swobodne opisy wyposażenia nie są automatycznie porównywane słowo w słowo.

Maksymalnie trzy strony / sześć żądań odczytu działa równocześnie. Występuje
jedno żądanie orientacji oraz dwa żądania na każdą stronę, także stronę bez
pozycji. Limit route to 120 s, globalne przerwanie żądań po 110 s, limit
orientacji 30 s i pojedynczego odczytu 55 s, bez automatycznych ponowień.
Dłuższy dokument może wyczerpać limit zamiast otrzymać niepełny sukces.
Wywołania mają ścisły JSON Schema i lokalne kontrole. Schemat nie potwierdza
poprawności odczytanych wymiarów.

PDF.js jest zewnętrznym ESM. Przed dev/build skrypt kopiuje renderer, worker,
fonty, CMap i WASM do generowanego pdf-runtime/ z dereferencją dowiązań pnpm.
Ten katalog jest w śladzie funkcji. Canvas jest statycznym importem zewnętrznym;
Next śledzi go razem z modułem natywnym. Jawne śledzenie plików pod aliasami
node_modules pnpm powodowało niepoprawny pakiet funkcji na Vercel. Nowe zależności:
`pdfjs-dist` i `@napi-rs/canvas`. Test natywny renderuje syntetyczny PDF i sprawdza
piksele po obrocie, nakładanie widoków i zgodność liczby stron. Mechanizmy
odczytu modelu są testowane atrapą; realny wynik nowego przebiegu trzeba
sprawdzić na PDF użytkownika. Prywatny dokument nie jest fixture w repo.

## Diagnostyka

Awaria zwraca etap, bezpieczny kod i losowy identyfikator żądania. Log zawiera
te same pola i opcjonalny liczbowy status dostawcy, bez surowego wyjątku,
PDF, obrazów, treści odczytu ani kluczy. Rozróżniamy limit, uwierzytelnienie,
niedostępność modelu, timeout oraz błąd struktury odpowiedzi. Niepewne dane
z poprawną strukturą dają czytelny szkic review, a nie ogólny błąd serwera.
