#!/usr/bin/env python3
"""
Generate warm, kid-friendly phoneme audio samples with the Gemini TTS API.

The script currently targets all the phonemes listed in the PHONEME_SAMPLES
dictionary and saves each sample as a WAV file.
"""

from __future__ import annotations

import argparse
import sys
import time
import wave
from pathlib import Path
from typing import Iterable

from google import genai
from google.genai import types


# The request uses IPA phonemes wrapped with SSML phoneme tags to steer the
# pronunciation. This dictionary is generated from the GOOGLE_TTS_PHONEMES file.
PHONEME_SAMPLES = {
    'popular': {'ipa': 'p', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='p'>p</phoneme></prosody></speak>", 'description': "as in 'popular'"},
    'bubble': {'ipa': 'b', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='b'>b</phoneme></prosody></speak>", 'description': "as in 'bubble'"},
    'tinker': {'ipa': 't', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='t'>t</phoneme></prosody></speak>", 'description': "as in 'tinker'"},
    'Dundee': {'ipa': 'd', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='d'>d</phoneme></prosody></speak>", 'description': "as in 'Dundee'"},
    'crown': {'ipa': 'k', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='k'>k</phoneme></prosody></speak>", 'description': "as in 'crown'"},
    'gravely': {'ipa': 'ɡ', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='ɡ'>ɡ</phoneme></prosody></speak>", 'description': "as in 'gravely'"},
    'mapping': {'ipa': 'm', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='m'>m</phoneme></prosody></speak>", 'description': "as in 'mapping'"},
    'nine': {'ipa': 'n', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='n'>n</phoneme></prosody></speak>", 'description': "as in 'nine'"},
    'bank': {'ipa': 'ŋ', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='ŋ'>ŋ</phoneme></prosody></speak>", 'description': "as in 'bank'"},
    'frog': {'ipa': 'f', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='f'>f</phoneme></prosody></speak>", 'description': "as in 'frog'"},
    'valve': {'ipa': 'v', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='v'>v</phoneme></prosody></speak>", 'description': "as in 'valve'"},
    'massage': {'ipa': 's', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='s'>s</phoneme></prosody></speak>", 'description': "as in 'massage'"},
    'zoom': {'ipa': 'z', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='z'>z</phoneme></prosody></speak>", 'description': "as in 'zoom'"},
    'thigh': {'ipa': 'θ', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='θ'>θ</phoneme></prosody></speak>", 'description': "as in 'thigh'"},
    'mother': {'ipa': 'ð', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='ð'>ð</phoneme></prosody></speak>", 'description': "as in 'mother'"},
    'shopping': {'ipa': 'ʃ', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='ʃ'>ʃ</phoneme></prosody></speak>", 'description': "as in 'shopping'"},
    'leisure': {'ipa': 'ʒ', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='ʒ'>ʒ</phoneme></prosody></speak>", 'description': "as in 'leisure'"},
    'mahogany': {'ipa': 'h', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='h'>h</phoneme></prosody></speak>", 'description': "as in 'mahogany'"},
    'lately': {'ipa': 'l', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='l'>l</phoneme></prosody></speak>", 'description': "as in 'lately'"},
    'roaring': {'ipa': 'ɹ', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='ɹ'>ɹ</phoneme></prosody></speak>", 'description': "as in 'roaring'"},
    'changed': {'ipa': 'ʧ', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='ʧ'>ʧ</phoneme></prosody></speak>", 'description': "as in 'changed'"},
    'magenta': {'ipa': 'ʤ', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='ʤ'>ʤ</phoneme></prosody></speak>", 'description': "as in 'magenta'"},
    'younger': {'ipa': 'j', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='j'>j</phoneme></prosody></speak>", 'description': "as in 'younger'"},
    'whirlwind': {'ipa': 'w', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='w'>w</phoneme></prosody></speak>", 'description': "as in 'whirlwind'"},
    'cat': {'ipa': 'æ', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='æ'>æ</phoneme></prosody></speak>", 'description': "as in 'cat'"},
    'car': {'ipa': 'ɑː', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='ɑː'>ɑː</phoneme></prosody></speak>", 'description': "as in 'car'"},
    'again': {'ipa': 'ə', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='ə'>ə</phoneme></prosody></speak>", 'description': "as in 'again'"},
    'bed': {'ipa': 'ɛ', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='ɛ'>ɛ</phoneme></prosody></speak>", 'description': "as in 'bed'"},
    'kit': {'ipa': 'ɪ', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='ɪ'>ɪ</phoneme></prosody></speak>", 'description': "as in 'kit'"},
    'unique': {'ipa': 'iː', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='iː'>iː</phoneme></prosody></speak>", 'description': "as in 'unique'"},
    'yacht': {'ipa': 'ɒ', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='ɒ'>ɒ</phoneme></prosody></speak>", 'description': "as in 'yacht'"},
    'caught': {'ipa': 'ɔː', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='ɔː'>ɔː</phoneme></prosody></speak>", 'description': "as in 'caught'"},
    'could': {'ipa': 'ʊ', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='ʊ'>ʊ</phoneme></prosody></speak>", 'description': "as in 'could'"},
    'school': {'ipa': 'uː', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='uː'>uː</phoneme></prosody></speak>", 'description': "as in 'school'"},
    'pulse': {'ipa': 'ʌ', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='ʌ'>ʌ</phoneme></prosody></speak>", 'description': "as in 'pulse'"},
    'nurse': {'ipa': 'ɜː', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='ɜː'>ɜː</phoneme></prosody></speak>", 'description': "as in 'nurse'"},
    'price': {'ipa': 'aɪ', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='aɪ'>aɪ</phoneme></prosody></speak>", 'description': "as in 'price'"},
    'flower': {'ipa': 'aʊ', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='aʊ'>aʊ</phoneme></prosody></speak>", 'description': "as in 'flower'"},
    'shade': {'ipa': 'eɪ', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='eɪ'>eɪ</phoneme></prosody></speak>", 'description': "as in 'shade'"},
    'square': {'ipa': 'eə', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='eə'>eə</phoneme></prosody></speak>", 'description': "as in 'square'"},
    'near': {'ipa': 'iə', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='iə'>iə</phoneme></prosody></speak>", 'description': "as in 'near'"},
    'choice': {'ipa': 'ɔɪ', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='ɔɪ'>ɔɪ</phoneme></prosody></speak>", 'description': "as in 'choice'"},
    'boat': {'ipa': 'əʊ', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='əʊ'>əʊ</phoneme></prosody></speak>", 'description': "as in 'boat'"},
    'cure': {'ipa': 'ʊə', 'ssml': "<speak><prosody rate='medium' pitch='+2st'><phoneme alphabet='ipa' ph='ʊə'>ʊə</phoneme></prosody></speak>", 'description': "as in 'cure'"},
}

# Gemini hosts multiple prebuilt voices; Kore is one of the allowed voices.
DEFAULT_VOICE = "Kore"
DEFAULT_MODEL = "gemini-2.5-flash-preview-tts"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate phoneme audio samples with Gemini TTS."
    )
    parser.add_argument(
        "--words",
        nargs="*",
        default=list(PHONEME_SAMPLES.keys()),
        help="Subset of phoneme keys to generate (defaults to all).",
    )
    parser.add_argument(
        "--output-dir",
        default="assets/audio/phonemes",
        help="Directory where the audio files will be written.",
    )
    parser.add_argument(
        "--voice",
        default=DEFAULT_VOICE,
        help=f"Gemini prebuilt voice to use (default: {DEFAULT_VOICE}).",
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help=f"Gemini model identifier (default: {DEFAULT_MODEL}).",
    )
    return parser.parse_args()


def ensure_words_exist(words: Iterable[str]) -> None:
    unknown = [word for word in words if word not in PHONEME_SAMPLES]
    if unknown:
        joined = ", ".join(sorted(unknown))
        raise SystemExit(f"Unsupported words requested: {joined}")


def instantiate_client() -> genai.Client:
    try:
        return genai.Client()
    except Exception as exc:  # pragma: no cover - defensive user feedback
        raise SystemExit(
            "Failed to construct Google GenAI client. Ensure GOOGLE_API_KEY is set. "
            f"Original error: {exc}"
        ) from exc

def wave_file(filename, pcm, channels=1, rate=24000, sample_width=2):
   with wave.open(filename, "wb") as wf:
      wf.setnchannels(channels)
      wf.setsampwidth(sample_width)
      wf.setframerate(rate)
      wf.writeframes(pcm)

def request_audio_bytes(
    client: genai.Client,
    *,
    model: str,
    ssml: str,
    voice_name: str,
) -> bytes:
    response = client.models.generate_content(
        model=model,
        contents=ssml,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=voice_name
                    )
                )
            ),
        ),
    )

    try:
        return response.candidates[0].content.parts[0].inline_data.data
    except (AttributeError, IndexError) as exc:
        raise RuntimeError("Gemini response did not include audio data.") from exc


def main() -> None:
    args = parse_args()
    ensure_words_exist(args.words)

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    client = instantiate_client()

    for word in args.words:
        output_path = output_dir / f"{word}.wav"
        if output_path.exists():
            print(f"Skipping existing file: {output_path}")
            continue

        print(f"Requesting audio for word: {word}")
        entry = PHONEME_SAMPLES[word]
        audio_bytes = request_audio_bytes(
            client,
            model=args.model,
            ssml=entry["ssml"],
            voice_name=args.voice,
        )

        wave_file(str(output_path), audio_bytes)

        print(f"Wrote {output_path} ({entry['description']})")
        time.sleep(10)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit("\nAborted by user.")
