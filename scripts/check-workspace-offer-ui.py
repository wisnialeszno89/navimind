import json, pathlib, subprocess, os, time, urllib.request, tempfile
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[1]
spec=json.loads((root/'contracts/window-offer-v1.example.json').read_text())
requests=[];errors=[]
# UI checks use fixture API responses; model quality is checked separately by Vercel gates.
with tempfile.TemporaryFile(mode='w+') as log:
 server=subprocess.Popen(['node','node_modules/next/dist/bin/next','start','--port','3107'],cwd=root,
  env={**os.environ,'NAVIMIND_WORKSPACE_MODE':'private','OPENAI_API_KEY':'ui-fixture-not-a-credential'},stdout=log,stderr=subprocess.STDOUT)
 try:
  for attempt in range(60):
   try:
    with urllib.request.urlopen('http://localhost:3107/workspace',timeout=1) as response:
     if response.status==200:break
   except Exception:
    if server.poll() is not None:
     log.seek(0);raise RuntimeError(log.read())
    time.sleep(.5)
  else:raise RuntimeError('WORKSPACE_UI_SERVER_NOT_READY')
  with sync_playwright() as p:
   browser=p.chromium.launch(headless=True)
   page=browser.new_page(accept_downloads=True,viewport={'width':1360,'height':1000})
   page.on('pageerror',lambda e: errors.append(str(e)))
   def enquiry(route):
    body=route.request.post_data_json;requests.append(('text',body))
    route.fulfill(json={'reply':'Odczytano pozycję 1. Sprawdź wymagania.','offerSpecification':spec})
   page.route('**/api/workspace/enquiry-plan',enquiry)
   page.goto('http://localhost:3107/workspace')
   page.get_by_label('Odczytaj zapytanie okienne PL/DE').check()
   page.get_by_label('Wiadomość',exact=True).fill(spec['positions'][0]['evidence'][0]['description'])
   page.get_by_role('button',name='Odczytaj zapytanie',exact=True).click()
   download_button=page.get_by_role('button',name='Pobierz specyfikację pozycji')
   download_button.wait_for()
   with page.expect_download() as download:
    download_button.click()
   assert download.value.suggested_filename=='specyfikacja-okien.json'
   assert json.loads(pathlib.Path(download.value.path()).read_text())==spec
   assert requests[0][1]['history']==[] and requests[0][1]['message']==spec['positions'][0]['evidence'][0]['description']
   assert page.get_by_label('Rozmowa o specyfikacji').is_checked()
   assert not page.get_by_label('Odczytaj zapytanie okienne PL/DE').is_checked()
   corrected=json.loads(json.dumps(spec));corrected['positions'][0]['width_mm']=1300
   corrected['positions'][0]['field_status']['width_mm']='corrected'
   corrected['corrections']=[{'position_id':'1','source_id':'1','field':'width_mm','before':1230,'value':1300,'quote':'Pozycja 1: szerokość 1300 mm, ilość 4 szt., na zewnątrz antracyt, otwieranie DKL.'}]
   corrected['schema_version']='window-offer/2'
   for field,value in [('quantity',4),('color_outside','antracyt'),('opening','DKL')]:
    before=corrected['positions'][0][field];corrected['positions'][0][field]=value
    corrected['positions'][0]['field_status'][field]='corrected'
    corrected['corrections'].append({'position_id':'1','source_id':'1','field':field,'before':before,'value':value,'quote':'Pozycja 1: szerokość 1300 mm, ilość 4 szt., na zewnątrz antracyt, otwieranie DKL.'})
   pending={'request':'Ustaw wysokość.','question':'Jaka ma być wysokość w mm?'}
   turns=[]
   def offer(route):
    body=route.request.post_data_json;turns.append(body)
    if body['message']=='Pozycja 1: szerokość 1300 mm, ilość 4 szt., na zewnątrz antracyt, otwieranie DKL.':
     assert body['specification']==spec and body['pending'] is None
     route.fulfill(json={'intent':'correct','reply':'Szerokość 1230 → 1300 mm.','offerSpecification':corrected,'pending':None})
    elif body['message']=='Ustaw wysokość.':
     assert body['specification']==corrected
     route.fulfill(json={'intent':'clarify','reply':pending['question'],'pending':pending})
    elif body['message']=='Co oznacza DKR?':
     assert body['specification']==corrected and body['pending']==pending
     route.fulfill(json={'intent':'reply','reply':'Rozwierno-uchylne prawe.','pending':pending})
    elif body['message']=='1000 mm':
     assert body['specification']==corrected and body['pending']==pending
     route.fulfill(status=503,json={'message':'Nie potwierdzono poprawki.'})
    else:
     assert body['message']=='Jakie są wymiary?' and body['specification']==spec and body['pending'] is None
     route.fulfill(json={'intent':'reply','reply':'1230 × 1478 mm.','pending':None})
   page.route('**/api/workspace/offer-turn',offer)
   def send_offer(text):
    page.get_by_label('Rozmowa i poprawki specyfikacji',exact=True).fill(text)
    with page.expect_response('**/api/workspace/offer-turn'):
     page.get_by_role('button',name='Wyślij do agenta ofertowego',exact=True).click()
   send_offer('Pozycja 1: szerokość 1300 mm, ilość 4 szt., na zewnątrz antracyt, otwieranie DKL.')
   page.get_by_role('button',name='Pobierz specyfikację pozycji').nth(1).wait_for()
   with page.expect_download() as download:
    page.get_by_role('button',name='Pobierz specyfikację pozycji').nth(1).click()
   assert json.loads(pathlib.Path(download.value.path()).read_text())==corrected
   send_offer('Ustaw wysokość.')
   page.get_by_text('Do doprecyzowania: '+pending['question'],exact=True).wait_for()
   send_offer('Co oznacza DKR?')
   page.get_by_text('Rozwierno-uchylne prawe.',exact=True).wait_for()
   assert page.get_by_text('Do doprecyzowania: '+pending['question'],exact=True).is_visible()
   send_offer('1000 mm')
   page.get_by_role('alert').filter(has_text='Nie potwierdzono poprawki.').wait_for()
   assert page.get_by_label('Rozmowa i poprawki specyfikacji',exact=True).input_value()=='1000 mm'
   assert page.get_by_role('button',name='Pobierz specyfikację pozycji').count()==2
   page.get_by_role('button',name='Pracuj nad tą wersją').nth(0).click()
   send_offer('Jakie są wymiary?')
   page.get_by_text('1230 × 1478 mm.',exact=True).wait_for()
   assert len(turns)==5
   def document(route):
    body=route.request.post_data_json;requests.append(('pdf',body))
    pdfspec=json.loads(json.dumps(spec));pdfspec['source'].update(kind='pdf',pages=1)
    for pos in pdfspec['positions']:
     pos['source_page']=1
     for e in pos['evidence']:e['page']=1
    route.fulfill(json={'reply':'Odczytano PDF.','offerSpecification':pdfspec})
   page.route('**/api/workspace/document-plan',document)
   page.locator('input[type=file][accept*="pdf"]').set_input_files({'name':'syntetyczny.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.4\nsynthetic UI fixture'})
   page.get_by_role('button',name='Odczytaj PDF',exact=True).click()
   page.get_by_role('button',name='Pobierz specyfikację pozycji').nth(2).wait_for()
   with page.expect_download() as download:
    page.get_by_role('button',name='Pobierz specyfikację pozycji').nth(2).click()
   assert json.loads(pathlib.Path(download.value.path()).read_text())['source']['kind']=='pdf'
   assert requests[-1][0]=='pdf' and requests[-1][1]['pdf'].startswith('data:application/pdf;base64,')
   # The original result must still download its original text source.
   with page.expect_download() as download:
    page.get_by_role('button',name='Pobierz specyfikację pozycji').nth(0).click()
   assert json.loads(pathlib.Path(download.value.path()).read_text())==spec
   assert errors==[], errors
   browser.close()
  print('WORKSPACE_UI=verified CHROMIUM=actual API_RESPONSES=fixtures TEXT_DOWNLOAD=True PDF_DOWNLOAD=True ORIGINAL_RESULT_PRESERVED=True CORRECTION_SESSION=True PENDING_DISCUSSION=True FAILED_EDIT_PRESERVED=True VERSION_SWITCH=True V2_COMMERCIAL=True')
 finally:
  server.terminate()
  try:server.wait(timeout=10)
  except subprocess.TimeoutExpired:server.kill();server.wait()
