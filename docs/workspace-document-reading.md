# Odczyt zapytania ze skanowanego PDF

W Workspace przycisk **Dołącz PDF zapytania** przyjmuje pojedynczy PDF do 2 MB
oraz 10 stron, bez hasła. Odczyt nie wymaga połączenia komputera. Załączenie PDF
przełącza wiadomość w analizę dokumentu; nie wywołuje lokalnego wykonawcy.

`/api/workspace/document-plan` wymaga prywatnego Workspace. Waliduje limit ciała,
kanoniczny Base64, nagłówek i strukturę PDF oraz rzeczywistą liczbę stron przez
pdf-lib. Oryginalny PDF jest przekazywany jako wejście plikowe modelu obsługującego
rysunki i tekst stron. Nazwa pliku u dostawcy to stałe `zapytanie.pdf`.
Model: `NAVIMIND_DOCUMENT_MODEL`, domyślnie `gpt-4.1-mini`; istniejący klucz modelu.
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
