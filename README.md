# Nameswipe 🍼

A private baby name swiping app for two people, synced in real time.

## Setup

### 1. Firebase (free)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it `nameswipe` → Continue through the steps
3. In your project, go to **Build → Realtime Database → Create database**
   - Choose a region (us-central1 is fine)
   - Start in **test mode** (you can lock it down later)
4. Go to **Project Settings** (gear icon) → **Your apps** → click the **</>** web icon
   - Register app name `nameswipe` → you'll see your config object with 7 values
   - Copy them — you'll need them in step 3

### 2. GitHub repo

1. Create a new **private** repo on GitHub named `nameswipe`
2. Push this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/nameswipe.git
   git push -u origin main
   ```
3. In your repo: **Settings → Pages → Source → GitHub Actions**

### 3. Add Firebase secrets to GitHub

In your repo: **Settings → Secrets and variables → Actions → New repository secret**

Add each of these (values come from your Firebase config):

| Secret name | Firebase config key |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_DATABASE_URL` | `databaseURL` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

### 4. Deploy

Push any change (or re-run the workflow in the Actions tab). Your site will be live at:
`https://YOUR_USERNAME.github.io/nameswipe/`

## How to use

1. One person opens the site and taps **Create a room** → shares the code
2. Other person taps **Join with a code** → enters the code
3. Swipe away — matches appear instantly on both devices 💜

## Local dev
```bash
# Create a .env.local file with your Firebase values:
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

npm install
npm run dev
```
