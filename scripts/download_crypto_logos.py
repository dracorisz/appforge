#!/usr/bin/env python3
import urllib.request
import urllib.error
import os
import json
import time
import ssl

PUBLIC_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'crypto-logos')
COINMAP_PATH = os.path.join(os.path.dirname(__file__), '..', 'public', 'crypto-logos', 'coinmap.json')
API_BASE = 'https://crypto-logo.com/api'
OUTPUT_DIR = os.path.abspath(PUBLIC_DIR)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

os.makedirs(OUTPUT_DIR, exist_ok=True)

def fetch_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
        return json.loads(r.read().decode('utf-8'))

def fetch_bytes(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx, timeout=20) as r:
        return r.read()

print('Fetching coin list...')
coins = fetch_json(f'{API_BASE}/coins.json')
print(f'Total coins: {len(coins)}')

coin_map = {}
downloaded = 0
skipped = 0
failed = 0

for i, coin in enumerate(coins, 1):
    slug = coin['slug']
    name = coin['name']
    ticker = coin['ticker']
    filename = f'{slug}.png'
    filepath = os.path.join(OUTPUT_DIR, filename)

    coin_map[slug] = {
        'slug': slug,
        'name': name,
        'ticker': ticker,
        'filename': filename,
        'localPath': f'/crypto-logos/{filename}'
    }

    if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
        skipped += 1
        if i % 100 == 0:
            print(f'[{i}/{len(coins)}] Skipped existing: {filename}')
        continue

    try:
        url = f'{API_BASE}/logo/{slug}.png?w=128&h=128'
        data = fetch_bytes(url)
        with open(filepath, 'wb') as f:
            f.write(data)
        downloaded += 1
        if i % 50 == 0:
            print(f'[{i}/{len(coins)}] Downloaded: {filename}')
        time.sleep(0.05)
    except Exception as e:
        failed += 1
        if i % 100 == 0:
            print(f'[{i}/{len(coins)}] Failed {filename}: {e}')

with open(COINMAP_PATH, 'w') as f:
    json.dump(coin_map, f, indent=2)

print(f'\nDone!')
print(f'  Downloaded: {downloaded}')
print(f'  Skipped:    {skipped}')
print(f'  Failed:     {failed}')
print(f'  Total:      {len(coins)}')
print(f'  Saved map to: {COINMAP_PATH}')
