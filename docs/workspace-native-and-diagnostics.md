# Obraz aplikacji, fakty techniczne i kontrola wyniku

Tryb **Aplikacja · Paint sterowany obrazem** wymaga `--native-paint`. Lokalny wykonawca uruchamia nowe okno klasycznego Painta Windows 10 z białym plikiem sesji. Kliknięcia, przeciąganie, tekst i ograniczona lista skrótów wynikają z obrazu okna, nie z gotowego szablonu rysunku. Wysłanie polecenia w tym trybie przekazuje zrzuty do modelu. Pierwszy test: dom, drzewo, słońce i napis NaviMind.

`/native/start` rozpoczyna sesję polecenia i przełącza fokus do własnego Painta. `/native/observe` odczytuje aktualny obraz. Żądania są dostępne tylko przez sparowaną pętlę lokalną. Serwer `/api/workspace/native-plan` waliduje PNG, wymiary i scope, następnie proponuje jeden krok oparty na obrazie i historii wyników. Nie dostaje kodu parowania, PID, HWND ani ścieżek lokalnych. Polecenia nie obejmują shell, Win+R, instalacji ani innych aplikacji.

Kontroler sprawdza aktualność klatki i proces przed wykonaniem. Zmiana stanu, utrata fokusu, zasłonięcie lub inny dokument zatrzymują krok. Sterownik zwalnia mysz w finally. Wyniki mają idempotentne identyfikatory; zerwana odpowiedź wymaga odczytu wyniku, bez powtarzania. Pętla ma 24 kroki, ograniczenie powtórzeń, dwa ponowne odczyty nieaktualnej klatki i zatrzymanie przed kolejną akcją.

Decyzja done nie jest samodzielnym potwierdzeniem sukcesu. Kontroler zapisuje istniejący PNG sesji i sprawdza zmianę pikseli. Czat oddziela potwierdzenie zapisu od wizualnej oceny modelu. Testy kodu i syntetyczne obrazy nie zastępują próby kliknięć na Windowsie. Ten etap nie gwarantuje obsługi dowolnego programu, dialogów ani dowolnej jakości rysunku. Rozszerzenie sterownika dotyczy mechanizmu, pierwszy obsługiwany scope pozostaje nowym Paintem.

`inspect_computer` w trybie **Praca na komputerze** zbiera odczytowe fakty o systemie, RAM i dysku do nowego JSON. Nie jest automatyczną naprawą, skanem malware, pomiarem procesów ani SMART. Zebrane fakty są pokazywane w czacie i mogą służyć jako kontekst diagnozy. Planista ma rozróżniać dane potwierdzone, hipotezy i potrzebne dalsze pomiary.

Testy: `node --test tests/native-plan.test.cjs tests/native-runner.test.cjs tests/desktop-plan.test.cjs`. Testy lokalne: `python -m pytest tests/test_navimind_native_system.py`. Dotychczasowe adaptery tabel, schematów i Chromium pozostają osobnymi metodami wykonywania zadań.
