#!/usr/bin/env python3
"""Builds the public CV PDFs from docs/cv/*.docx without phone number and e-mail.

The original .docx files contain private contact data and are NOT committed
(see .gitignore). Run locally after updating the CV:

    python3 tools/build-cv-pdf.py
"""
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs" / "cv"
OUT = ROOT / "public" / "cv"

EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")
PHONE = re.compile(r"\+?\d{2}\s?\d{2}\s?\d{4,5}-?\d{4}")


def sanitize(xml: str) -> str:
    def clean_paragraph(p: str) -> str:
        if not (EMAIL.search(p) or PHONE.search(p)):
            return p
        # Drop hyperlinks whose text is an e-mail address.
        p = re.sub(
            r"<w:hyperlink\b[^>]*>(?:(?!</w:hyperlink>).)*?@(?:(?!</w:hyperlink>).)*?</w:hyperlink>",
            "",
            p,
            flags=re.S,
        )
        # Remove the phone number (and its separator) from text runs.
        p = re.sub(r"\s·\s" + PHONE.pattern + r"\s·\s", "", p)
        p = PHONE.sub("", p)
        p = EMAIL.sub("", p)
        return p

    return re.sub(r"<w:p[ >].*?</w:p>", lambda m: clean_paragraph(m.group(0)), xml, flags=re.S)


def main() -> int:
    if not shutil.which("soffice"):
        print("LibreOffice (soffice) not found", file=sys.stderr)
        return 1
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for docx in sorted(SRC.glob("*.docx")):
            target = Path(tmp) / docx.name
            with zipfile.ZipFile(docx) as zin, zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as zout:
                for item in zin.infolist():
                    data = zin.read(item.filename)
                    if item.filename == "word/document.xml":
                        data = sanitize(data.decode("utf-8")).encode("utf-8")
                    zout.writestr(item, data)
            subprocess.run(
                ["soffice", "--headless", "--convert-to", "pdf", "--outdir", str(OUT), str(target)],
                check=True,
                stdout=subprocess.DEVNULL,
            )
            print(f"built {OUT / docx.with_suffix('.pdf').name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
