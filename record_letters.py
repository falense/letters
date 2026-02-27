# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "sounddevice",
#     "soundfile",
#     "numpy",
# ]
# ///
"""Interactive CLI tool to record spoken letter names for the Norwegian alphabet."""

import sys
import threading
from pathlib import Path

import numpy as np
import sounddevice as sd
import soundfile as sf

SAMPLE_RATE = 44100
SOUNDS_DIR = Path(__file__).parent / "public" / "sounds" / "letters"

ALPHABET = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
    "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
    "U", "V", "W", "X", "Y", "Z", "Æ", "Ø", "Å",
]

# Norwegian letter pronunciations as hints
PRONUNCIATIONS = {
    "A": "ah", "B": "beh", "C": "seh", "D": "deh", "E": "eh",
    "F": "eff", "G": "geh", "H": "hå", "I": "ih", "J": "jådd",
    "K": "kå", "L": "ell", "M": "emm", "N": "enn", "O": "oo",
    "P": "peh", "Q": "kuu", "R": "err", "S": "ess", "T": "teh",
    "U": "uu", "V": "veh", "W": "dobbelt-veh", "X": "eks",
    "Y": "yy", "Z": "sett", "Æ": "æ", "Ø": "ø", "Å": "å",
}

# Safe filenames for special characters
FILENAMES = {letter: letter.lower() for letter in ALPHABET}
FILENAMES["Æ"] = "ae"
FILENAMES["Ø"] = "oe"
FILENAMES["Å"] = "aa"


def record_until_enter() -> np.ndarray:
    """Record audio until the user presses Enter."""
    frames = []

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
    SOUNDS_DIR.mkdir(parents=True, exist_ok=True)

    # Check which letters already have recordings
    existing = {
        letter
        for letter in ALPHABET
        if (SOUNDS_DIR / f"{FILENAMES[letter]}.wav").exists()
    }

    if existing:
        print(f"Already recorded: {', '.join(sorted(existing))}")
        choice = input("Re-record all, skip existing, or quit? [r/S/q] ").strip().lower()
        if choice == "q":
            return
        skip_existing = choice != "r"
    else:
        skip_existing = False

    print("\n=== Norwegian Alphabet Recorder ===\n")
    print("For each letter:")
    print("  1. Press Enter to START recording")
    print("  2. Say the letter name")
    print("  3. Press Enter to STOP recording")
    print("  4. Listen to playback, then confirm or re-record")
    print("  Press 's' to skip a letter, 'q' to quit\n")

    for i, letter in enumerate(ALPHABET):
        filename = SOUNDS_DIR / f"{FILENAMES[letter]}.wav"

        if skip_existing and letter in existing:
            print(f"  Skipping {letter} (already recorded)")
            continue

        while True:
            hint = PRONUNCIATIONS.get(letter, "")
            print(f'--- [{i + 1}/{len(ALPHABET)}] Letter: {letter}  (say: "{hint}") ---')
            print("Press Enter to start recording (s=skip, q=quit)...", end="", flush=True)

            cmd = input().strip().lower()
            if cmd == "q":
                print("Quit.")
                return
            if cmd == "s":
                print(f"  Skipped {letter}\n")
                break

            print("Recording... Press Enter to stop.", end="", flush=True)

            audio = record_until_enter()
            duration = len(audio) / SAMPLE_RATE
            print(f"  Recorded {duration:.1f}s")

            if duration < 0.1:
                print("  Too short, try again.\n")
                continue

            print("  Playing back...", flush=True)
            play_audio(audio)

            choice = input("  Save? [Y/n] ").strip().lower()
            if choice in ("", "y"):
                sf.write(str(filename), audio, SAMPLE_RATE)
                print(f"  Saved -> {filename}\n")
                break
            print("  Re-recording...\n")

    print("\nDone! Recorded letters are in:", SOUNDS_DIR)


if __name__ == "__main__":
    main()
