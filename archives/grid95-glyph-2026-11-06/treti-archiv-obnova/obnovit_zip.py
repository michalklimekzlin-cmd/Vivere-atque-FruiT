#!/usr/bin/env python3
"""Obnoví ZIP z archivu uloženého v GitHubu. Ověřuje původní Git blob SHA-1."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json

root = Path(__file__).resolve().parent
records = json.loads((root / "manifest.json").read_text(encoding="utf-8"))["entries"]
base = (root / "data").resolve()
out = root / "CHT360-GLYPH-492-zachranenych-souboru-2026-11-06.zip"
with ZipFile(out, "w", compression=ZIP_DEFLATED, compresslevel=6) as z:
    for r in records:
        path = (base / r["path"]).resolve()
        if not path.is_relative_to(base) or not path.is_file():
            raise ValueError("Chybějící nebo nebezpečná cesta: " + r["path"])
        data = path.read_bytes()
        actual = hashlib.sha1(b"blob " + str(len(data)).encode() + bytes([0]) + data).hexdigest()
        if len(data) != r["size"] or actual != r["blob_sha"]:
            raise ValueError("Nesouhlasí kontrolní součet: " + r["path"])
        z.writestr(r["path"], data)
print("Hotovo:", out, "- souborů:", len(records))
