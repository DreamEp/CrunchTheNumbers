# CrunchTheNumbers

A desktop application for sports coaches to track participants, sessions, and accounting.

![Electron](https://img.shields.io/badge/Electron-40-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)

## Features

- **Participant Management** - Track clients with contact info, age, and notes
- **Session Planning** - Calendar-based scheduling with drag-and-drop
- **Credit Packs** - Manage prepaid session packages with expiration tracking
- **Accounting Dashboard** - Visual indicators for payment status and session usage
- **PDF Export** - Generate reports and invoices
- **Offline First** - All data stored locally, no internet required

## Download

### Latest Release

| Platform | Download |
|----------|----------|
| macOS (Intel + Apple Silicon) | [**Télécharger mac-app.zip**](https://nightly.link/DreamEp/CrunchTheNumbers/workflows/build/main/mac-app.zip) |
| Windows | [**Télécharger windows-portable.zip**](https://nightly.link/DreamEp/CrunchTheNumbers/workflows/build/main/windows-portable.zip) |

> Les liens ci-dessus téléchargent automatiquement la dernière version compilée.

## Installation

### macOS

1. Download and extract `mac-app.zip`
2. Double-click `CrunchTheNumbers-1.0.1.dmg`
3. Drag **CrunchTheNumbers** to the **Applications** folder
4. Launch from Applications

> **Note**: If macOS blocks the app ("unidentified developer"):
> - Go to **System Settings** > **Privacy & Security**
> - Click **Open Anyway**

### Windows

1. Download and extract `windows-portable.zip`
2. Run `CrunchTheNumbers Setup 1.0.1.exe` for installation
   - Or use `CrunchTheNumbers 1.0.1.exe` for portable version (no install)

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/DreamEp/CrunchTheNumbers.git
cd CrunchTheNumbers

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build

```bash
# Build for current platform
npm run package

# Build for specific platform
npm run package:win   # Windows
npm run package:mac   # macOS
```

Output files will be in the `dist/` folder.

## Tech Stack

- **Framework**: Electron 40
- **UI**: React 18 + TypeScript
- **Styling**: Tailwind CSS (Catppuccin Mocha theme)
- **State**: Zustand
- **Storage**: electron-store (JSON-based)
- **Build**: electron-vite + electron-builder
- **PDF**: jsPDF + jspdf-autotable

## Project Structure

```
src/
├── main/           # Electron main process
│   ├── index.ts    # App entry, window management
│   └── storage.ts  # Data persistence
├── preload/        # Context bridge (IPC)
├── renderer/       # React frontend
│   ├── components/ # UI components
│   ├── stores/     # Zustand state
│   └── utils/      # Helpers
└── shared/         # Shared types
```

## License

MIT
