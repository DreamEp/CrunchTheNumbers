# CrunchTheNumbers

A desktop application for sports coaches to track participants, sessions, and accounting.

![Electron](https://img.shields.io/badge/Electron-40-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)

## Features

- **Participant Management** - Track clients with contact info, age, and notes
- **Session Planning** - Calendar-based scheduling with recurring days and manual date markers (vacation, cancelled, sick)
- **Credit Packs** - Manage prepaid session packages with expiration tracking (default: 10 sessions, 15€/session, 6 months validity)
  - Color-coded status indicators (green → yellow → red) based on remaining sessions and expiration proximity
  - Manual pack expiration and reactivation from history
  - Automatic archival of depleted/expired packs when adding a new one
  - Session debt tracking: negative balances carry over to the next pack
- **Pack History** - View past expired or depleted packs per participant, with option to reactivate
- **Accounting Dashboard** - Visual indicators for payment status and session usage (supports negative balances)
- **Reports & Export** - Generate reports in PDF, CSV, JSON, and HTML formats
- **Offline First** - All data stored locally, no internet required

## Download

### Latest Release

| Platform | Download |
|----------|----------|
| macOS (Intel + Apple Silicon) | [GitHub Actions](https://github.com/DreamEp/CrunchTheNumbers/actions) (Artifacts → mac-app) |
| Windows | [GitHub Actions](https://github.com/DreamEp/CrunchTheNumbers/actions) (Artifacts → windows-portable) |

[Voir toutes les releases](https://github.com/DreamEp/CrunchTheNumbers/releases)

## Installation

### macOS

1. Go to [GitHub Actions](https://github.com/DreamEp/CrunchTheNumbers/actions), click the latest successful build
2. Download the **mac-app** artifact (zip)
3. Extract and open the `.dmg` file
4. Drag **CrunchTheNumbers** to the **Applications** folder
5. Launch from Applications

> **Note**: If macOS blocks the app ("unidentified developer"):
> - Go to **System Settings** > **Privacy & Security**
> - Click **Open Anyway**

### Windows

1. Go to [GitHub Actions](https://github.com/DreamEp/CrunchTheNumbers/actions), click the latest successful build
2. Download the **windows-portable** artifact (zip)
3. Extract and run `CrunchTheNumbers Setup X.X.X.exe` for installation
   - Or use the portable `.exe` (no install needed)

## Data Persistence

All data is stored locally via **electron-store** in a JSON file:

| Platform | Data location |
|----------|---------------|
| macOS | `~/Library/Application Support/crunchthenumbers/crunchthenumbers-data.json` |
| Windows | `%APPDATA%\crunchthenumbers\crunchthenumbers-data.json` |
| Linux | `~/.config/crunchthenumbers/crunchthenumbers-data.json` |

**Upgrading the app preserves your data** — the data file is independent of the application binary. Uninstalling and reinstalling, or replacing the `.exe`/`.dmg`, will not delete your data. The app automatically migrates data from the old `paintracker-data.json` file if present.

To manually backup or migrate data, copy the `crunchthenumbers-data.json` file.

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

### Build via GitHub Actions

1. Push a version tag: `git tag v1.x.x && git push origin v1.x.x`
   - Or trigger manually: GitHub repo → Actions → "Build App" → Run workflow
2. Wait for the build to complete (~5 min)
3. Download artifacts from the workflow run page:
   - **mac-app** → contains `.dmg` and `.zip`
   - **windows-portable** → contains `.exe` files

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
