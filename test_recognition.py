#!/usr/bin/env python3
"""Draw a letter on the canvas and check console output."""
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
    subprocess.run(
        [sys.executable, "-m", "playwright", "install", "chromium"],
        capture_output=True,
    )

    server = subprocess.Popen(
        ["npx", "vite", "--port", "5174"],
        cwd=os.path.dirname(os.path.abspath(__file__)),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    try:
        time.sleep(3)

        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 800, "height": 900})

            logs = []
            page.on("console", lambda msg: logs.append(f"[{msg.type}] {msg.text}"))

            page.goto("http://localhost:5174", wait_until="networkidle")
            page.wait_for_timeout(2000)  # wait for model to load

            # Find the canvas
            canvas = page.locator("#draw-canvas")
            box = canvas.bounding_box()
            cx, cy = box["x"], box["y"]
            w, h = box["width"], box["height"]

            print(f"Canvas at ({cx},{cy}) size {w}x{h}")

            # Draw an "A" shape on the canvas
            # Left leg
            page.mouse.move(cx + w*0.3, cy + h*0.8)
            page.mouse.down()
            page.mouse.move(cx + w*0.5, cy + h*0.15, steps=10)
            page.mouse.up()
            page.wait_for_timeout(100)

            # Right leg
            page.mouse.move(cx + w*0.5, cy + h*0.15)
            page.mouse.down()
            page.mouse.move(cx + w*0.7, cy + h*0.8, steps=10)
            page.mouse.up()
            page.wait_for_timeout(100)

            # Crossbar
            page.mouse.move(cx + w*0.35, cy + h*0.55)
            page.mouse.down()
            page.mouse.move(cx + w*0.65, cy + h*0.55, steps=10)
            page.mouse.up()

            # Screenshot after drawing
            page.screenshot(path="/tmp/test_draw.png")
            print("Drew an A, waiting for auto-recognition...")

            # Wait for auto-recognition (1.5s debounce + processing)
            page.wait_for_timeout(3000)

            page.screenshot(path="/tmp/test_result.png")

            print("\nConsole logs:")
            for log in logs:
                print(f"  {log}")

            browser.close()
    finally:
        server.send_signal(signal.SIGTERM)
        server.wait()


if __name__ == "__main__":
    main()
