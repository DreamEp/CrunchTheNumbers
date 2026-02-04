# Building CrunchTheNumbers for Mac

This guide explains how to create the Mac application for non-developers.

---

## Option A: Build on a Mac (No coding experience required)

### Step 1: Install Node.js

1. Open Safari and go to: https://nodejs.org/
2. Click the **LTS** version (green button) to download
3. Open the downloaded `.pkg` file
4. Follow the installer instructions (click "Continue" until done)
5. Restart your Mac after installation

### Step 2: Download the project

1. Go to the GitHub repository: `https://github.com/YOUR_USERNAME/CrunchTheNumbers`
2. Click the green **"Code"** button
3. Click **"Download ZIP"**
4. Open your Downloads folder and double-click the ZIP to extract it

### Step 3: Open Terminal

1. Press `Cmd + Space` to open Spotlight
2. Type **Terminal** and press Enter
3. A black/white window will open - this is the Terminal

### Step 4: Navigate to the project folder

In Terminal, type the following (replace the path if needed):

```bash
cd ~/Downloads/CrunchTheNumbers-main
```

Press Enter.

### Step 5: Install dependencies

Type this command and press Enter:

```bash
npm install
```

Wait for it to finish (may take 2-5 minutes).

### Step 6: Build the application

Type this command and press Enter:

```bash
npm run package:mac
```

Wait for it to finish (may take 3-5 minutes).

### Step 7: Get your application

1. Open Finder
2. Navigate to the project folder → `dist` folder
3. You will find:
   - **CrunchTheNumbers-1.0.0.dmg** - This is your installer!
   - **CrunchTheNumbers-1.0.0-mac.zip** - Alternative version

### Step 8: Install the app

1. Double-click **CrunchTheNumbers-1.0.0.dmg**
2. A window opens showing the app and Applications folder
3. Drag **CrunchTheNumbers** to the **Applications** folder
4. Open Applications and double-click CrunchTheNumbers to launch

> **Note**: If macOS says the app is from an "unidentified developer":
> 1. Go to **System Settings** → **Privacy & Security**
> 2. Scroll down and click **"Open Anyway"** next to the CrunchTheNumbers message

---

## Option B: Use GitHub Actions (Build automatically in the cloud)

This option requires no software installation on the Mac. The build happens on GitHub's servers.

### Step 1: Create a GitHub account

1. Go to https://github.com/
2. Click **Sign up** and create an account
3. Verify your email address

### Step 2: Push the code to GitHub (done by developer on Windows)

On the Windows machine with the code:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit"

# Create repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/CrunchTheNumbers.git
git branch -M main
git push -u origin main
```

### Step 3: Trigger the build

**Option 1 - Using a version tag:**
```bash
git tag v1.0.0
git push --tags
```

**Option 2 - Manual trigger:**
1. Go to your repository on GitHub
2. Click the **"Actions"** tab
3. Click **"Build App"** in the left sidebar
4. Click the **"Run workflow"** dropdown (right side)
5. Click the green **"Run workflow"** button

### Step 4: Wait for the build

1. The build will appear in the Actions list
2. Click on it to see progress
3. Wait until you see a green checkmark (takes ~5-10 minutes)

### Step 5: Download the Mac application

1. Click on the completed build (with green checkmark)
2. Scroll down to **"Artifacts"**
3. Click **"mac-app"** to download
4. A ZIP file will download containing the DMG and app

### Step 6: Send to Mac user

Send the downloaded `mac-app.zip` file to the Mac user. They should:

1. Unzip the file
2. Double-click **CrunchTheNumbers-1.0.0.dmg**
3. Drag the app to Applications
4. Launch from Applications

> **Note**: If macOS blocks the app:
> 1. Go to **System Settings** → **Privacy & Security**
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
1. **System Settings** → **Privacy & Security**
2. Click **"Open Anyway"**

### Build fails on GitHub Actions
- Check the Actions log for error messages
- Ensure all files are committed and pushed
- Try running the workflow again

---

## Summary

| Method | Difficulty | Requirements |
|--------|------------|--------------|
| Option A (Local) | Easy | Mac + Internet |
| Option B (GitHub) | Very Easy | GitHub account |

**Recommended**: Use **Option B** if you want to avoid installing anything on the Mac.
