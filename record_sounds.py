# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "sounddevice",
#     "soundfile",
#     "numpy",
# ]
# ///
"""Interactive CLI tool to record sound feedback phrases for the Letters app."""

import sys
import threading
from pathlib import Path

import numpy as np
import sounddevice as sd
import soundfile as sf

SAMPLE_RATE = 44100
SOUNDS_DIR = Path(__file__).parent / "sounds"

PHRASES = {
    "positive": ["Supert!", "Du fikk det til!"],
    "negative": ["Ikke helt riktig", "Prøv igjen", "Dette klarer du"],
}


def record_until_enter() -> np.ndarray:
    """Record audio until the user presses Enter."""
    frames = []
    stop_event = threading.Event()

    def callback(indata, frame_count, time_info, status):
        if status:
            print(f"  (status: {status})", file=sys.stderr)
        frames.append(indata.copy())

    stream = sd.InputStream(
        samplerate=SAMPLE_RATE, channels=1, dtype="float32", callback=callback
    )
    stream.start()
    input()
    stream.stop()
    stream.close()

    return np.concatenate(frames, axis=0)


def play_audio(data: np.ndarray) -> None:
    """Play back recorded audio and wait until finished."""
    sd.play(data, samplerate=SAMPLE_RATE)
    sd.wait()


def main() -> None:
    SOUNDS_DIR.mkdir(exist_ok=True)

    print("=== Letters Sound Recorder ===\n")
    print("For each phrase:")
    print("  1. Press Enter to START recording")
    print("  2. Say the phrase")
    print("  3. Press Enter to STOP recording")
    print("  4. Listen to playback, then confirm or re-record\n")

    for category, phrases in PHRASES.items():
        for i, phrase in enumerate(phrases):
            filename = SOUNDS_DIR / f"{category}_{i}.wav"

            while True:
                print(f'--- [{category}_{i}] Say: "{phrase}" ---')
                print("Press Enter to start recording...", end="", flush=True)
                input()
                print("🔴 Recording... Press Enter to stop.", end="", flush=True)

                audio = record_until_enter()
                print(f"  Recorded {len(audio) / SAMPLE_RATE:.1f}s")

                print("  Playing back...", flush=True)
                play_audio(audio)

                choice = input("  Save? [Y/n/q] ").strip().lower()
                if choice == "q":
                    print("Aborted.")
                    return
                if choice in ("", "y"):
                    sf.write(str(filename), audio, SAMPLE_RATE)
                    print(f"  Saved → {filename}\n")
                    break
                print("  Re-recording...\n")

    print("All phrases recorded!")


if __name__ == "__main__":
    main()
