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

# ID video Dailymotion (x8qckyq) biasanya tetap, yang berubah cuma token sec2(...)
URL_PATTERN = re.compile(
    r"https://live[.\w-]*\.cf\.dmcdn\.net/sec2\([^)]+\)/dm/3/x8qckyq/d/live-\d+\.m3u8(?:#cell=[\w-]+)?"
)


def sniff_m3u8() -> str:
    found = []

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        def on_request(request):
            m = URL_PATTERN.search(request.url)
            if m and request.url not in found:
                found.append(request.url)

        page.on("request", on_request)

        page.goto(TARGET_PAGE, wait_until="networkidle", timeout=45000)
        # beri waktu player mulai memutar & memanggil manifest m3u8
        page.wait_for_timeout(8000)

        browser.close()

    if not found:
        print("Gagal menangkap URL m3u8 Trans 7 dari halaman sumber.")
        sys.exit(1)

    # prioritaskan kualitas yang sama dengan yang sudah ada di playlist (480)
    preferred = [u for u in found if "live-480" in u]
    return preferred[0] if preferred else found[0]


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
