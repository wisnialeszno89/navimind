# Pomoc na podstawie zrzutu ekranu

W prywatnym workspace można dołączyć PNG, JPG lub WebP do 2 MB, przez przycisk albo wklejenie obrazu w polu wiadomości. Windows: Win+Shift+S → zaznacz obszar → przejdź do pola wiadomości → Ctrl+V. Przed wysłaniem widać miniaturę, nazwę i informację o przekazaniu obrazu do modelu. Obraz wysyłany jest dopiero po naciśnięciu Wyślij zrzut.

Wiadomość z obrazem zawsze trafia do rozmowy z modelem, również przy zaznaczonej Pracy na komputerze. Nie uruchamia lokalnych działań. Model analizuje przekazany widok, nie przejmuje karty Firefox/Chrome i nie ma sesji zalogowanego użytkownika. Po zmianie strony do ponownego odczytu może być potrzebny nowy zrzut. Obrazy pozostają w pamięci bieżącej karty, bez osobnej bazy plików. Historia kolejnych wywołań zawiera tekst, a nie ponowne przesyłanie starych obrazów.

API przyjmuje wyłącznie osadzone dane obrazu, sprawdza format Base64, sygnaturę PNG/JPEG/WebP i limit. Nie pobiera wskazanych przez klienta adresów obrazów. Strumień żądania ma limit 3 MB. Nie zapisuje obrazów w repozytorium ani logach aplikacji. Przekazuje obraz dostawcy modelu w celu wykonania analizy.

W sprawach płatności model ma rozróżnić zwrot zakupu i wypłatę salda sklepu, ustalić konkretną transakcję oraz prowadzić użytkownika według odczytanego widoku. Nie wykonuje zwrotów, wypłat ani końcowych zatwierdzeń. Sama otwarta karta przeglądarki nie jest podłączona do lokalnego wykonawcy. Użytkownik może zasłonić zbędne dane przed wysłaniem; asystent nie prosi o hasła, kody logowania, pełne numery kart lub klucze API.
