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
   page.get_by_role('button',name='Pobierz specyfikację pozycji').nth(1).wait_for()
   with page.expect_download() as download:
    page.get_by_role('button',name='Pobierz specyfikację pozycji').nth(1).click()
   assert json.loads(pathlib.Path(download.value.path()).read_text())['source']['kind']=='pdf'
   assert requests[-1][0]=='pdf' and requests[-1][1]['pdf'].startswith('data:application/pdf;base64,')
   # The original result must still download its original text source.
   with page.expect_download() as download:
    page.get_by_role('button',name='Pobierz specyfikację pozycji').nth(0).click()
   assert json.loads(pathlib.Path(download.value.path()).read_text())==spec
   assert errors==[], errors
   browser.close()
  print('WORKSPACE_UI=verified CHROMIUM=actual API_RESPONSES=fixtures TEXT_DOWNLOAD=True PDF_DOWNLOAD=True ORIGINAL_RESULT_PRESERVED=True')
 finally:
  server.terminate()
  try:server.wait(timeout=10)
  except subprocess.TimeoutExpired:server.kill();server.wait()
