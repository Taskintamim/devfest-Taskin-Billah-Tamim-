TenderFlow — Tender Document Package Builder
AI DevFest 2026 · AI Vibe-Coding Contest
A browser-first tender document verification and package-building workspace designed to help office staff prepare a complete, validated, correctly ordered submission package with confidence.

Overview
Preparing a tender submission is often a manual process: staff must inspect many PDFs, determine which file belongs to which requirement, verify expiry dates, detect duplicates, arrange documents in the correct order, and finally combine everything into one submission-ready PDF.
TenderFlow turns that workflow into a single guided workspace.
The product is built around one simple journey:
Upload → Understand → Fix → Verify → Generate
Instead of treating the task as a basic PDF merger, TenderFlow treats it as a document verification and decision-support workflow.
The Problem
Tender submissions may contain:
- Mandatory and optional documents
- Documents with expiry requirements
- Multiple candidate PDF files
- Duplicate files with different filenames
- Strict document ordering requirements
- Submission deadlines that affect document validity
A small mistake can make a package incomplete or cause a bid to be rejected.
TenderFlow helps reduce those risks by making the requirements, document matches, validation state, and final package readiness visible in one place.
What the Application Does
1. Tender Requirement Import
Users can load a requirements.json file and immediately see:
- Tender ID
- Tender title
- Procuring entity
- Bidder
- Submission deadline
- Ordered document requirements
- Mandatory / optional status
- Expiry requirements
Requirements are automatically presented in the tender's specified order.
2. Multi-PDF Upload
Users can upload multiple PDF files at once through a dedicated document workspace.
For every uploaded file, the application provides useful metadata such as:
- File name
- File size
- Page count
- Processing state
- Duplicate status
Non-PDF files are rejected with a clear user-facing message.
3. One-to-One Document Matching
Each required document can be matched to a file while maintaining strict one-to-one relationships:
- One requirement → maximum one file
- One file → maximum one requirement
Matches can be changed or removed at any time.
4. Expiry Verification
For requirements that have an expiry condition, the user can enter the document expiry date.
TenderFlow validates the date against the tender submission deadline.
An expiry date on the submission deadline is considered valid.
5. Exact Duplicate Detection
Duplicate detection is based on the actual PDF content rather than the filename.
This means two files such as:
trade-license.pdf
trade-license-copy.pdf
can still be identified as duplicates when their content is identical.
The application prevents duplicate content from being incorrectly used for separate requirements.
6. Real-Time Requirement Status
Every requirement always has one clear status:
Status	Meaning	Blocks Package
Missing	Required document has no matched file	Yes
Expiry Date Needed	Expiry is required but not entered	Yes
Expired	Expiry is before the submission deadline	Yes
Not Provided	Optional document has no matched file	No
OK	Document is valid for submission	No


The status updates immediately when the user changes a match, expiry date, or uploaded file.
7. Package Readiness
The interface turns document validation into an easy decision:
Can this package be generated?

Users can immediately see:
- Missing required documents
- Expiry problems
- Duplicate conflicts
- Other blocking issues
- Overall package readiness
The primary package action is automatically enabled only when blocking issues are resolved.
8. Submission-Ready PDF Generation
Once all blocking problems are resolved, the application generates one combined PDF package directly in the browser.
The generated package includes:
Cover page
- Tender ID
- Tender title
- Procuring entity
- Bidder name
- Submission deadline
- Package creation date
- Included documents in final order
Document package
- Documents sorted according to tender order
- All source pages preserved
- Optional unprovided documents skipped
Page footer
Every page uses:
<tender_id> | Page X of Y
The final package is downloaded as:
<tender_id>_Package.pdf
User Experience
TenderFlow is intentionally designed as a document command center rather than a generic admin dashboard.
The interface emphasizes:
- Clear information hierarchy
- Strong status visibility
- Contextual actions
- Minimal cognitive load
- Premium micro-interactions
- Responsive layout
- Professional typography
- Meaningful empty and error states
- English ↔ Bangla switching
The goal is to let a non-technical office worker understand:
1. What tender is being prepared
2. What documents are required
3. What is already valid
4. What is blocking submission
5. What needs to be fixed
6. When the package is ready
Bilingual Experience
The complete core workflow is available in:
- English
- বাংলা
Document requirement names use the appropriate localized field:
- English → title_en
- Bangla → title_bn
The selected language is preserved locally for a smoother workflow.
Frontend-First Architecture
TenderFlow is intentionally built as a frontend-only application.
All core document processing happens inside the browser.
Core technologies
- React — application UI
- Vite — development/build tooling
- Tailwind CSS — interface styling
- Framer Motion / Motion — interaction and transition polish
- Lucide React — consistent icon system
- pdf-lib — PDF manipulation and package generation
- pdf.js — browser-side PDF inspection where needed
- Web Crypto API — SHA-256 document fingerprinting
- localStorage — lightweight browser-side preferences/state where appropriate
No participant-controlled backend or database is required for the core workflow.
Why This Approach
The product deliberately prioritizes:
Correctness + clarity + speed + usability

over unnecessary technical complexity.
The application avoids introducing a backend-dependent architecture into a workflow that can be handled safely in the browser.
This also keeps tender documents local during normal processing.
Main Product Flow
┌──────────────────────┐
│ Load Tender Details  │
│   requirements.json  │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Upload PDF Documents │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Match Files to       │
│ Requirements         │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Validate Status      │
│ • Missing            │
│ • Expired            │
│ • Duplicate          │
│ • OK                 │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Resolve Blocking     │
│ Problems             │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Package Ready        │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Generate Final PDF   │
└──────────────────────┘
Design Philosophy
TenderFlow follows a focused product-design principle:
Make the important things obvious.
Instead of overwhelming the user with charts or decorative widgets, the interface gives visual priority to:
- Requirements
- Document matches
- Validation status
- Blocking problems
- Package readiness
- Final generation action
Motion is used primarily for feedback and state transitions rather than decoration.
Reliability & Safety
The application is designed to fail gracefully.
Examples include:
- Invalid PDF → clear error instead of application crash
- Missing expiry → explicit blocking status
- Expired document → explicit blocking status
- Optional missing document → non-blocking status
- Duplicate content → visible warning/protection
- PDF generation failure → preserve current working state
- Invalid input → actionable error message
The core workflow does not depend on a remote AI service or a participant-controlled backend.
Contest Submission Artifacts
The repository is intended to contain the contest deliverables, including:
output/
└── <tender_id>_Package.pdf

screenshots/
└── status-workflow.png
The generated package is produced by the application workflow using the provided sample pack.
Project Structure
A simplified structure:
.
├── public/
├── src/
│   ├── components/
│   ├── lib/
│   ├── state/
│   ├── App.jsx
│   └── ...
├── output/
├── screenshots/
├── sample-pack/
├── AGENT.md
├── README.md
├── LICENSE
├── package.json
├── vite.config.js
└── index.html
Local Development
Requirements
- Node.js
- npm
- Modern Chromium-based browser recommended
Install
npm install
Run development server
npm run dev
Production build
npm run build
Preview production build
npm run preview
Deployment
The application is designed for static HTTPS deployment and does not require a server-side runtime for the core workflow.
Recommended platforms include:
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages
Privacy by Design
Tender documents are processed in the browser for the core workflow.
The application does not require a participant-controlled backend, database, or document-upload service to perform its main functionality.
No API key is required for the core application flow.
AI-Assisted Development
This project was developed using AI-assisted vibe coding, with the implementation guided by structured product, UX, and engineering prompts.
The development process emphasized:
- rapid iteration
- component-based frontend architecture
- UI/UX consistency
- requirement-driven validation
- browser-side PDF processing
- production-minded error handling
- contest-time prioritization
AI was used as a development accelerator; the submitted application remains the responsibility of the participant.
Known Limitations
The application intentionally keeps the core architecture lightweight and frontend-only.
Potential limitations may include:
- Browser memory usage can increase with very large or numerous PDFs.
- PDF rendering/manipulation behavior may vary with unusual or malformed source documents.
- Advanced document intelligence beyond the defined tender rules is intentionally outside the core scope.
The core workflow is prioritized over speculative automation.
Demo Flow
For a quick evaluation, the intended experience is:
1. Load the tender requirements.
2. Review the tender overview.
3. Upload the supplied PDFs.
4. Match documents to requirements.
5. Review status and duplicate warnings.
6. Enter required expiry dates.
7. Resolve all blocking issues.
8. Reach Package Ready.
9. Generate the submission package.
10. Download <tender_id>_Package.pdf.
Project Information
Project: Tender Document Package Builder
Contest: AI DevFest 2026 — AI Vibe-Coding Contest
Mode: Solo
Application: Frontend-only web application
GitHub:
https://github.com/Taskintamim/devfest-Taskin-Billah-Tamim-
Live Demo:
<ADD_PUBLIC_HTTPS_URL>
Participant:
<YOUR_FULL_NAME>
Registration Number:
<YOUR_REGISTRATION_NUMBER>
License
This project is released under the MIT License.
See LICENSE for details.
Final Product Principle
A tender package should not be generated simply because files exist.
It should be generated only when the required documents have been checked, validated, ordered, and are ready for submission.

TenderFlow is built around that principle.
