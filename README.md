# AI-Powered Resume Tailor 📄✨

A modern, highly interactive SaaS application designed to perfectly tailor PDF resumes to any Job Description. The platform extracts text from user-uploaded PDFs, leverages the LLaMA 3.3 model via Groq to suggest strategic, ATS-optimized enhancements, and dynamically injects the accepted changes directly back into the original PDF layout using an advanced PyMuPDF rendering engine.

## 🌟 Features

- **Precise PDF Parsing**: Accurately extracts raw text and structure from standard PDF files using `unpdf`.
- **AI-Driven Tailoring**: Integrates with Groq's high-speed inference API to generate highly contextual, rationale-backed resume suggestions.
- **Interactive Review UI**: A stunning "Vintage Paper" themed interface featuring Framer Motion animations, side-by-side diff viewers, and an intuitive accept/reject toggle workflow.
- **In-Place PDF Generation**: Uses a standalone Python PyMuPDF engine to accurately locate, redact, and replace text over the original PDF without sacrificing the user's custom design or typography.

## 🏗️ Architecture & Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Runtime & Package Manager**: [Bun](https://bun.sh/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
- **AI Inference**: [Groq API](https://groq.com/) (LLaMA 3.3)
- **PDF Engine**: [PyMuPDF](https://pymupdf.readthedocs.io/en/latest/) (Python 3)

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Bun** (Latest version)
- **Python 3** (v3.9 or higher)
- **pip3** (Python package installer)

## 🚀 Getting Started

### 1. Installation

Clone the repository and install the Node dependencies. (The `postinstall` script will automatically attempt to install the required Python dependencies).

```bash
bun install
```

If the Python dependencies fail to install automatically, you can install them manually:

```bash
pip3 install pymupdf --break-system-packages
```

### 2. Environment Variables

Create a `.env.local` file in the root directory and add your Groq API key:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Running the Development Server

Start the development server using Bun:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 📂 Project Structure

```text
resume-tailor/
├── scripts/
│   └── pdf_editor.py          # PyMuPDF backend engine for precise text replacement
├── src/
│   ├── app/
│   │   ├── api/               # Next.js API Routes (PDF parsing, Groq AI, PDF Export)
│   │   ├── globals.css        # Vintage Paper Tailwind styling & custom variables
│   │   └── page.tsx           # Main application entry point
│   ├── components/
│   │   ├── ui/                # Reusable shadcn/ui components
│   │   └── wizard/            # Core business logic components (Upload, Review, Export)
│   ├── lib/                   # Utility functions
│   └── store/
│       └── useWizardStore.ts  # Zustand global state management
├── .env.local                 # Environment variables (not tracked in git)
└── package.json
```

## 🧠 How the PDF Rendering Engine Works

Modifying text _in-place_ on modern PDFs is notoriously difficult due to **Identity-H font subsetting** (where fonts are stripped of unused characters and assigned custom glyph indices).

To solve this without destroying the user's layout, this application uses a dual-engine approach:

1. **Frontend Orchestration**: The Next.js `/api/export-pdf` route handles file I/O, writing the original PDF and the JSON modifications to temporary files.
2. **Python Redaction**: Next.js spawns `scripts/pdf_editor.py`. This script uses PyMuPDF to scan the PDF for the exact `(x, y)` bounding boxes of the original text, retrieves the font size and color, permanently redacts the old text layer, and injects the tailored text seamlessly using fallback Base-14 fonts.
