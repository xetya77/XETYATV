"""
Sniff URL m3u8 Trans 7 dari sevenhub.id/live (player Dailymotion, dirender via JS)
dan tulis ke manifest kecil streams/trans7.m3u8.

xetyasmarttv.m3u sendiri cukup diarahkan SEKALI ke:
  https://raw.githubusercontent.com/xetya77/XETYATV/main/streams/trans7.m3u8
dan tidak perlu diubah lagi -- yang berubah tiap kali cron jalan cuma isi
file kecil ini (manifest HLS master 1 baris, di-refetch player tiap buka stream).

Dijalankan otomatis oleh .github/workflows/update-trans7.yml
"""

import re
import sys
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

TARGET_PAGE = "https://sevenhub.id/live"
STREAM_MANIFEST_PATH = Path("streams/trans7.m3u8")
DEBUG_DIR = Path("debug")
PREFERRED_RESOLUTION = "480"

# Pola ketat: ID video Dailymotion (x8qckyq) biasanya tetap, yang berubah cuma token sec2(...)
STRICT_PATTERN = re.compile(
    r"https://live[.\w-]*\.cf\.dmcdn\.net/sec2\([^)]+\)/dm/3/x8qckyq/d/live-\d+\.m3u8(?:#cell=[\w-]+)?"
)
LOOSE_PATTERN = re.compile(r"https://[^\s\"']*\.cf\.dmcdn\.net/[^\s\"']*\.m3u8[^\s\"']*")
RESOLUTION_PATTERN = re.compile(r"/live-\d+\.m3u8")

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)


def dump_debug(page, note: str) -> None:
    DEBUG_DIR.mkdir(exist_ok=True)
    try:
        page.screenshot(path=str(DEBUG_DIR / "screenshot.png"), full_page=True)
    except Exception as e:
        print(f"Gagal ambil screenshot: {e}")
    try:
        (DEBUG_DIR / "page.html").write_text(page.content(), encoding="utf-8")
    except Exception as e:
        print(f"Gagal simpan HTML: {e}")
    print(note)


def sniff_m3u8() -> str:
    strict_hits: list[str] = []
    loose_hits: list[str] = []
    bad_responses: list[str] = []

    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(
            user_agent=UA,
            locale="id-ID",
            timezone_id="Asia/Jakarta",
            viewport={"width": 1366, "height": 768},
        )
        page = context.new_page()

        def on_request(request):
            url = request.url
            if STRICT_PATTERN.search(url):
                if url not in strict_hits:
                    strict_hits.append(url)
            elif LOOSE_PATTERN.search(url):
                if url not in loose_hits:
                    loose_hits.append(url)

        def on_response(response):
            if response.status >= 400:
                bad_responses.append(f"{response.status} {response.url}")

        page.on("request", on_request)
        page.on("response", on_response)

        main_status = None
        try:
            main_response = page.goto(TARGET_PAGE, wait_until="domcontentloaded", timeout=45000)
            main_status = main_response.status if main_response else None
        except Exception as e:
            print(f"Peringatan saat goto (dilanjutkan): {e}")

        print(f"Status halaman utama: {main_status}")

        for selector in ["video", "button[aria-label*='play' i]", "[class*='play' i]"]:
            try:
                page.click(selector, timeout=3000)
                print(f"Berhasil klik elemen: {selector}")
                break
            except Exception:
                continue

        page.wait_for_timeout(15000)

        if not strict_hits and not loose_hits:
            dump_debug(page, "Tidak ada m3u8 tertangkap -- menyimpan screenshot & HTML ke debug/ untuk dianalisis.")

        browser.close()

    if bad_responses:
        print("Response HTTP error yang tertangkap (>=400):")
        for r in bad_responses[:20]:
            print(f"  - {r}")

    if strict_hits:
        preferred = [u for u in strict_hits if f"live-{PREFERRED_RESOLUTION}" in u]
        return preferred[0] if preferred else strict_hits[0]

    if loose_hits:
        print("Pola ketat (ID video x8qckyq) tidak cocok, tapi ada m3u8 dmcdn.net lain:")
        for u in loose_hits:
            print(f"  - {u}")
        print("Kemungkinan ID video berubah -- sesuaikan STRICT_PATTERN di script ini.")
        sys.exit(1)

    print("Tidak ada request m3u8 dari cf.dmcdn.net yang tertangkap sama sekali.")
    print("Lihat artifact 'debug-sevenhub' pada run ini (screenshot.png + page.html) untuk tahu penyebabnya.")
    sys.exit(1)


def force_resolution(url: str, resolution: str = PREFERRED_RESOLUTION) -> str:
    """Ganti angka resolusi di path URL (mis. live-240.m3u8 -> live-480.m3u8)."""
    return RESOLUTION_PATTERN.sub(f"/live-{resolution}.m3u8", url)


def url_is_playable(url: str, timeout: int = 8) -> bool:
    """Cek ringan (GET manifest, bukan download stream) apakah URL masih valid."""
    try:
        clean_url = url.split("#", 1)[0]  # fragment (#cell=...) tidak dikirim ke server
        req = urllib.request.Request(clean_url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status == 200
    except Exception as e:
        print(f"Cek validitas URL gagal ({url}): {e}")
        return False


def resolve_final_url(sniffed_url: str) -> str:
    forced_url = force_resolution(sniffed_url, PREFERRED_RESOLUTION)
    if forced_url == sniffed_url:
        return sniffed_url
    if url_is_playable(forced_url):
        print(f"Berhasil paksa ke resolusi {PREFERRED_RESOLUTION}p: {forced_url}")
        return forced_url
    print(
        f"URL hasil paksa resolusi {PREFERRED_RESOLUTION}p tidak valid, "
        f"pakai hasil sniff asli sebagai fallback: {sniffed_url}"
    )
    return sniffed_url


def update_stream_manifest(new_url: str) -> None:
    """
    Tulis manifest HLS master kecil (EXT-X-STREAM-INF) yang menunjuk ke URL asli.
    Inilah yang bikin link di xetyasmarttv.m3u bisa tetap SATU & PERMANEN --
    yang berubah cuma isi file kecil ini.
    """
    new_content = f"#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1400000\n{new_url}\n"

    if STREAM_MANIFEST_PATH.exists():
        old_content = STREAM_MANIFEST_PATH.read_text(encoding="utf-8")
        if old_content.strip() == new_content.strip():
            print("URL tidak berubah, tidak ada yang perlu di-commit.")
            return
        old_last_line = old_content.strip().splitlines()[-1] if old_content.strip() else "(kosong)"
        print(f"Update manifest Trans 7:\n  lama: {old_last_line}\n  baru: {new_url}")
    else:
        print(f"Membuat manifest Trans 7 baru: {new_url}")

    STREAM_MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    STREAM_MANIFEST_PATH.write_text(new_content, encoding="utf-8")


if __name__ == "__main__":
    sniffed = sniff_m3u8()
    final_url = resolve_final_url(sniffed)
    update_stream_manifest(final_url)
