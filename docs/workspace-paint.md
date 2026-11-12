# Paint — schemat okna z polecenia

Wykonawca uruchomiony z `--paint` zgłasza możliwość `draw_window_in_paint`. Czat udostępnia ją w trybie **Praca na komputerze**. Tryb **Przeglądarka** musi być wyłączony. Można uruchomić oba adaptery: `python tools/run_navimind_desktop_bridge.py --execute-live --browser --paint`.

Polecenie testowe: `Przygotuj w Paint schemat okna 1500 x 1400 mm, dwa skrzydła ze stałym słupkiem, lewe DKL i prawe DKR, kolor antracyt. Zapisz jako okno-test.png w folderze Rysunki.`

Planista tworzy walidowane parametry, lokalny moduł renderuje nowy PNG, sprawdza piksele po odczycie i otwiera go w nowym procesie klasycznego Painta Windows 10. Wynik zawiera ścieżkę i potwierdzenie okna. Nie jest to bezpośrednie sterowanie narzędziami rysowania Painta. Obsługa myszy i swobodne rysunki wymagają kolejnego adaptera. Schemat jest poglądowy, od wewnątrz, z proporcjami wynikającymi z wymiarów w mm. Nie jest projektem WH ani potwierdzeniem wykonalności konstrukcji.

Dostępne schematy: pojedyncze DKL (zawiasy lewe, klamka prawa), pojedyncze DKR (odwrotnie), dwa skrzydła ze stałym słupkiem (lewe DKL, prawe DKR). Kolory: biały, antracyt, mahoń. Nieobsługiwane układy i obrazy wymagają wyjaśnienia zakresu, bez zastępowania ich innym rysunkiem.

Rysunki domyślnie trafiają do `Pulpit\NaviMind-Praca\Rysunki`. Przy zajętej nazwie powstaje nowy plik z przyrostkiem. Aktywna tabela pozostaje bez zmian. Brak potwierdzenia nowego okna daje `review` ze ścieżką zachowanego PNG; nie jest prezentowany jako pełne wykonanie. Po zerwaniu połączenia odczyt wyniku nie powtarza uruchomienia Painta.

Walidacja planu: `node --test tests/desktop-plan.test.cjs`. Testy renderera i idempotencji: `python -m pytest tests/test_navimind_paint.py`. Próba okna na Windows: `python tools/test_navimind_paint_live.py --execute-live`. Testy z atrapą otwierania nie zastępują tego ostatniego sprawdzenia.
