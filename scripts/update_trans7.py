"""
Sniff URL m3u8 Trans 7 dari sevenhub.id/live (player Dailymotion, dirender via JS)
dan update baris URL yang sesuai di xetyasmarttv.m3u.

Dijalankan otomatis oleh .github/workflows/update-trans7.yml
"""

import re
import sys
from playwright.sync_api import sync_playwright

TARGET_PAGE = "https://sevenhub.id/live"
PLAYLIST_PATH = "xetyasmarttv.m3u"
CHANNEL_MARK = "Trans 7"

# Pola ketat: ID video Dailymotion (x8qckyq) biasanya tetap, yang berubah cuma token sec2(...)
STRICT_PATTERN = re.compile(
    r"https://live[.\w-]*\.cf\.dmcdn\.net/sec2\([^)]+\)/dm/3/x8qckyq/d/live-\d+\.m3u8(?:#cell=[\w-]+)?"
)
# Pola longgar buat diagnostik kalau pola ketat tidak cocok lagi (mis. ID video berubah)
LOOSE_PATTERN = re.compile(r"https://[^\s\"']*\.cf\.dmcdn\.net/[^\s\"']*\.m3u8[^\s\"']*")


def sniff_m3u8() -> str:
    strict_hits: list[str] = []
    loose_hits: list[str] = []

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        def on_request(request):
            url = request.url
            if STRICT_PATTERN.search(url):
                if url not in strict_hits:
                    strict_hits.append(url)
            elif LOOSE_PATTERN.search(url):
                if url not in loose_hits:
                    loose_hits.append(url)

        page.on("request", on_request)

        # PENTING: jangan pakai wait_until="networkidle" -- halaman live stream
        # selalu ada request jalan terus, jadi networkidle tidak akan pernah tercapai.
        try:
            page.goto(TARGET_PAGE, wait_until="domcontentloaded", timeout=45000)
        except Exception as e:
            print(f"Peringatan saat goto (dilanjutkan): {e}")

        # beri waktu player mulai memutar & memanggil manifest m3u8
        page.wait_for_timeout(15000)

        browser.close()

    if strict_hits:
        preferred = [u for u in strict_hits if "live-480" in u]
        return preferred[0] if preferred else strict_hits[0]

    if loose_hits:
        print("Pola ketat (ID video x8qckyq) tidak cocok, tapi ada m3u8 dmcdn.net lain:")
        for u in loose_hits:
            print(f"  - {u}")
        print("Kemungkinan ID video berubah -- sesuaikan STRICT_PATTERN di script ini.")
        sys.exit(1)

    print("Tidak ada request m3u8 dari cf.dmcdn.net yang tertangkap sama sekali.")
    print("Kemungkinan: player butuh interaksi klik dulu, ada consent popup, atau IP runner diblokir.")
    sys.exit(1)


def update_playlist(new_url: str) -> None:
    with open(PLAYLIST_PATH, "r", encoding="utf-8") as f:
        lines = f.readlines()

    for i, line in enumerate(lines):
        if line.startswith("#EXTINF") and CHANNEL_MARK in line:
            j = i + 1
            while j < len(lines) and lines[j].strip() == "":
                j += 1
            if j < len(lines) and lines[j].strip().startswith("http"):
                old_url = lines[j].rstrip("\n")
                if old_url == new_url:
                    print("URL tidak berubah, tidak ada yang perlu di-commit.")
                    return
                lines[j] = new_url + "\n"
                print(f"Update URL Trans 7:\n  lama: {old_url}\n  baru: {new_url}")
            break
    else:
        print(f"Entri '{CHANNEL_MARK}' tidak ditemukan di {PLAYLIST_PATH}.")
        sys.exit(1)

    with open(PLAYLIST_PATH, "w", encoding="utf-8") as f:
        f.writelines(lines)


if __name__ == "__main__":
    url = sniff_m3u8()
    update_playlist(url)
