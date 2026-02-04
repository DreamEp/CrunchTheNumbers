# Installing CrunchTheNumbers on Mac

This guide explains how to install the Mac application for non-developers.

---

## Quick Download (Recommended)

**No coding required!** Download the pre-built app:

1. Go to: **https://github.com/DreamEp/CrunchTheNumbers/actions**
2. Click the latest build with a green checkmark
3. Scroll down to **Artifacts**
4. Click **mac-app** to download
5. Extract the ZIP and double-click **CrunchTheNumbers-1.0.1.dmg**
6. Drag the app to **Applications**

> **If macOS blocks the app:**
> Go to **System Settings** > **Privacy & Security** > Click **Open Anyway**

---

## Option A: Build on a Mac (No coding experience required)

If you want to build the app yourself:

### Step 1: Install Node.js

1. Open Safari and go to: https://nodejs.org/
2. Click the **LTS** version (green button) to download
3. Open the downloaded `.pkg` file
4. Follow the installer instructions (click "Continue" until done)
5. Restart your Mac after installation

### Step 2: Download the project

1. Go to: https://github.com/DreamEp/CrunchTheNumbers
2. Click the green **"Code"** button
3. Click **"Download ZIP"**
4. Open your Downloads folder and double-click the ZIP to extract it

### Step 3: Open Terminal

1. Press `Cmd + Space` to open Spotlight
2. Type **Terminal** and press Enter
3. A black/white window will open - this is the Terminal

### Step 4: Navigate to the project folder

In Terminal, type the following:

```bash
cd ~/Downloads/CrunchTheNumbers-main
```

Press Enter.

### Step 5: Install dependencies

Type this command and press Enter:

```bash
npm install
```

Wait for it to finish.

### Step 6: Build the application

Type this command and press Enter:

```bash
npm run package:mac
```

Wait for it to finish.

### Step 7: Get your application

1. Open Finder
2. Navigate to the project folder > `dist` folder
3. You will find:
   - **CrunchTheNumbers-1.0.1.dmg** - This is your installer!
   - **CrunchTheNumbers-1.0.1-mac.zip** - Alternative version

### Step 8: Install the app

1. Double-click **CrunchTheNumbers-1.0.1.dmg**
2. A window opens showing the app and Applications folder
3. Drag **CrunchTheNumbers** to the **Applications** folder
4. Open Applications and double-click CrunchTheNumbers to launch

> **Note**: If macOS says the app is from an "unidentified developer":
> 1. Go to **System Settings** > **Privacy & Security**
> 2. Scroll down and click **"Open Anyway"** next to the CrunchTheNumbers message

---

## Option B: Use GitHub Actions (Automated cloud build)

This option builds the app automatically on GitHub's servers.

### Download from GitHub Actions

1. Go to: https://github.com/DreamEp/CrunchTheNumbers/actions
2. Click on the latest successful build (green checkmark)
3. Scroll down to **"Artifacts"**
4. Click **"mac-app"** to download
5. A ZIP file will download containing the DMG

### Install

1. Extract the downloaded ZIP
2. Double-click **CrunchTheNumbers-1.0.1.dmg**
3. Drag the app to Applications
4. Launch from Applications

> **Note**: If macOS blocks the app:
> 1. Go to **System Settings** > **Privacy & Security**
> 2. Click **"Open Anyway"**

---

## Troubleshooting

### "npm: command not found"
Node.js is not installed. Follow Step 1 in Option A.

### "The application is damaged and can't be opened"
Run this command in Terminal:
```bash
xattr -cr /Applications/CrunchTheNumbers.app
```

### "App from unidentified developer"
1. **System Settings** > **Privacy & Security**
2. Click **"Open Anyway"**

---

## Summary

| Method | Difficulty | Requirements |
|--------|------------|--------------|
| Quick Download | Easiest | Just download and install |
| Option A (Local Build) | Easy | Mac + Internet |
| Option B (GitHub Actions) | Easy | GitHub account (optional) |

**Recommended**: Use the **Quick Download** option at the top of this page.
