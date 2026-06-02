import requests
import json
import time
import sys

IMGBB_KEY = 'de10f7f874d9dbf904fe0cd0ad00332d'

SOURCE_PROJECT = 'dimaboutique-b4f16'
SOURCE_BASE = f'https://firestore.googleapis.com/v1/projects/{SOURCE_PROJECT}/databases/(default)/documents'

TARGET_RTDB = 'https://sardchocolate-a11c3-default-rtdb.firebaseio.com'

def upload_to_imgbb(base64_data):
    clean = base64_data
    if clean.startswith('data:'):
        clean = clean.split(',', 1)[1]
    try:
        r = requests.post('https://api.imgbb.com/1/upload', data={'key': IMGBB_KEY, 'image': clean}, timeout=30)
        data = r.json()
        if data.get('success'):
            return data['data']['url']
        print(f"  imgbb error: {data.get('error', {}).get('message', 'unknown')}")
    except Exception as e:
        print(f"  imgbb exception: {e}")
    return base64_data

def is_base64_image(s):
    if not s or not isinstance(s, str):
        return False
    return s.startswith('data:image') or (len(s) > 500 and all(c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=' for c in s[:100]))

def fv_to_py(val):
    if 'stringValue' in val: return val['stringValue']
    elif 'integerValue' in val: return int(val['integerValue'])
    elif 'doubleValue' in val: return float(val['doubleValue'])
    elif 'booleanValue' in val: return val['booleanValue']
    elif 'nullValue' in val: return None
    elif 'arrayValue' in val:
        return [fv_to_py(v) for v in val['arrayValue'].get('values', [])]
    elif 'mapValue' in val:
        return {k: fv_to_py(v) for k, v in val['mapValue'].get('fields', {}).items()}
    elif 'timestampValue' in val: return val['timestampValue']
    return str(val)

def py_to_fv(val):
    if val is None: return {'nullValue': None}
    elif isinstance(val, bool): return {'booleanValue': val}
    elif isinstance(val, int): return {'integerValue': str(val)}
    elif isinstance(val, float): return {'doubleValue': val}
    elif isinstance(val, str): return {'stringValue': val}
    elif isinstance(val, list):
        if len(val) == 0: return {'arrayValue': {}}
        return {'arrayValue': {'values': [py_to_fv(v) for v in val]}}
    elif isinstance(val, dict):
        if len(val) == 0: return {'mapValue': {}}
        return {'mapValue': {'fields': {k: py_to_fv(v) for k, v in val.items()}}}
    return {'stringValue': str(val)}

def read_collection(path):
    url = f"{SOURCE_BASE}/{path}"
    docs = []
    page_token = None
    while True:
        params = {'pageSize': 100}
        if page_token: params['pageToken'] = page_token
        r = requests.get(url, params=params, timeout=30)
        if r.status_code != 200:
            print(f"  Error reading {path}: {r.status_code} - {r.text[:200]}")
            return docs
        data = r.json()
        for doc in data.get('documents', []):
            doc_id = doc['name'].split('/')[-1]
            fields = doc.get('fields', {})
            py_data = {k: fv_to_py(v) for k, v in fields.items()}
            docs.append({'id': doc_id, 'data': py_data})
        page_token = data.get('nextPageToken')
        if not page_token: break
    return docs

def write_doc(collection, doc_id, data):
    url = f"{TARGET_RTDB}/{collection}/{doc_id}.json"
    r = requests.put(url, json=data, timeout=30)
    return r.status_code in [200, 201]

print("=== SARDCHOCOLATE MIGRATION ===")
print(f"Source: {SOURCE_PROJECT}/projects/sardchocolate/")
print(f"Target: RTDB {TARGET_RTDB}/ (root level)")
print()

print("1. Reading products...")
products = read_collection('projects/sardchocolate/products')
print(f"   Found {len(products)} products")

print("2. Reading settings...")
settings = read_collection('projects/sardchocolate/siteSettings')
print(f"   Found {len(settings)} settings docs")

print("3. Reading discounts...")
discounts = read_collection('projects/sardchocolate/discounts')
print(f"   Found {len(discounts)} discounts")

print("4. Reading orders...")
orders = read_collection('projects/sardchocolate/orders')
print(f"   Found {len(orders)} orders")

print("\n5. Processing product images...")
for i, p in enumerate(products):
    name = p['data'].get('name', p['id'])
    print(f"   [{i+1}/{len(products)}] {name}")
    img = p['data'].get('image', '')
    if is_base64_image(img):
        print(f"      Uploading to imgbb...")
        new_url = upload_to_imgbb(img)
        if new_url != img:
            p['data']['image'] = new_url
            print(f"      OK: {new_url[:70]}")
        else:
            print(f"      FAILED")
        time.sleep(1)
    images = p['data'].get('images', [])
    if isinstance(images, list):
        for j, im in enumerate(images):
            if is_base64_image(im):
                new_url = upload_to_imgbb(im)
                if new_url != im:
                    p['data']['images'][j] = new_url
                time.sleep(1)

print("\n6. Writing products to target...")
ok = 0
for p in products:
    if write_doc('products', p['id'], p['data']):
        ok += 1
        print(f"   OK: {p['data'].get('name', p['id'])}")
    else:
        print(f"   FAIL: {p['data'].get('name', p['id'])}")
print(f"   {ok}/{len(products)} products written")

print("\n7. Writing settings...")
for s in settings:
    r = write_doc('siteSettings', s['id'], s['data'])
    print(f"   {'OK' if r else 'FAIL'}: {s['id']}")

print("\n8. Writing discounts...")
for d in discounts:
    r = write_doc('discounts', d['id'], d['data'])
    print(f"   {'OK' if r else 'FAIL'}: {d['id']}")

print("\n9. Writing orders...")
for o in orders:
    write_doc('orders', o['id'], o['data'])
print(f"   {len(orders)} orders written")

print("\n=== MIGRATION COMPLETE ===")
