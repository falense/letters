#!/usr/bin/env python3
"""Take a screenshot of the dev server using Playwright."""
# /// script
# requires-python = ">=3.10"
# dependencies = ["playwright"]
# ///
import subprocess
import sys
import time
import signal
import os
from playwright.sync_api import sync_playwright

def main():
    url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173"
    output = sys.argv[2] if len(sys.argv) > 2 else "/tmp/screenshot.png"

    # Install browsers if needed
    subprocess.run(
        [sys.executable, "-m", "playwright", "install", "chromium"],
        capture_output=True,
    )

    # Start vite dev server
    server = subprocess.Popen(
        ["npx", "vite", "--port", "5173"],
        cwd=os.path.dirname(os.path.abspath(__file__)),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    try:
        # Wait for server to start
        time.sleep(3)

        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 1280, "height": 900})
            page.goto(url, wait_until="networkidle")
            page.wait_for_timeout(1000)
            page.screenshot(path=output)
            browser.close()

        print(output)
    finally:
        server.send_signal(signal.SIGTERM)
        server.wait()


if __name__ == "__main__":
    main()
