# CV source files (private)

`Marcos_Cantelli_CV_PT.docx` and `Marcos_Cantelli_CV_EN.docx` are the source of truth for the
site content, but they contain private contact data and are **not committed** (see `.gitignore`).

After editing them, update `src/content/cv.*.ts` and regenerate the public PDFs
(phone number and e-mail are stripped automatically):

```bash
python3 tools/build-cv-pdf.py
```
