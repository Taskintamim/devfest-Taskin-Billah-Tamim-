# Folio — Tender Package Builder

AI DevFest 2026 · AI Vibe-Coding Contest

A browser-first workspace for verifying tender documents and generating one submission-ready PDF.

**Participant:** Taskin Billah Tamim  
**Registration number:** See contest portal  
**Live URL:** https://taskintamim.github.io/devfest-Taskin-Billah-Tamim-/  
**GitHub:** https://github.com/Taskintamim/devfest-Taskin-Billah-Tamim-

The product follows one journey:

**Upload → Understand → Fix → Verify → Generate**

## How to run

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in latest Chrome. No login. No install.

```bash
npm run build
npm run preview
```

## Main features

- Load `requirements.json` and show tender details plus the ordered document schedule
- English / Bangla UI, with language stored in `localStorage`
- Requirement names use `title_en` / `title_bn`
- Upload PDFs only (non-PDF files such as PNG are rejected)
- Page counts, SHA-256 duplicate detection, one-to-one matching
- Exact statuses: Missing, Expiry date needed, Expired, Not provided, OK
- Expiry on the submission deadline is valid
- Generate is enabled only when every blocking issue is resolved
- Browser PDF generation with pdf-lib:
  - English cover page
  - Document index
  - Source PDFs merged in tender `order`
  - Footer `<tender_id> | Page X of Y` on every page
  - Download as `<tender_id>_Package.pdf`

## Bonus features

- Filename-based match suggestions
- Document index page after the cover, with each included file’s starting page

## Sample output

`output/T-2026-0417_Package.pdf` was generated through the app from the official sample pack.

Hidden sample issues handled in the workspace:

- `company_logo.png` rejected (not a PDF)
- `experience_cert.pdf` and `experience_cert (1).pdf` flagged as identical
- `trade_license_2025.pdf` vs `trade_license_2026.pdf` — 2026 used
- `scan_0042.pdf` matched as Signed Declaration
- Optional documents left as Not provided
- Expiry dates entered for Trade License and Bank Solvency

## Known problems

- Encrypted or damaged PDFs may be unreadable; they are marked invalid and cannot be matched
- Filename suggestions can miss poorly named scans (for example `scan_0042.pdf`)
- Workspace state is in-memory; a full refresh clears matches and files (language is kept)
- The generated cover is English-only, as required by the PDF specification
- Very large PDFs can use substantial browser memory

## AI tools used

- Cursor (Grok 4.6 agent)

## Most useful prompt

The three-part contest build sequence in `prompts/`, especially Part 3: generate only after revalidation, keep the English cover, merge in tender order, stamp `tender_id | Page X of Y` on every page, and stop adding features once the core workflow is stable.

## License

MIT. See `LICENSE`.
