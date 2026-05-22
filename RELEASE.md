# MCT Bank — Release Build Guide

## Prerequisites

- Node.js 18+
- Android Studio (latest stable)
- Java 17 (JDK)
- A signing keystore (create once, keep forever)

---

## Step 1 — Build the Web App

```bash
cd frontend
npm install
npm run build
# Output: frontend/dist/
```

---

## Step 2 — Sync to Android

```bash
cd frontend
npx cap sync android
# Copies dist/ into android/app/src/main/assets/public/
```

---

## Step 3 — Generate Icons and Splash Screens

Install the Capacitor Assets tool:

```bash
npm install -g @capacitor/assets
```

Place your source files:
```
frontend/
  resources/
    icon.png          # 1024x1024 px, PNG, no transparency, MCT Bank logo
    icon-foreground.png  # 1024x1024 px for adaptive icon foreground
    icon-background.png  # 1024x1024 px, solid navy (#003087) background
    splash.png        # 2732x2732 px, navy background with centered logo
    splash-dark.png   # (optional) dark mode splash
```

Generate all icon and splash sizes:
```bash
cd frontend
npx @capacitor/assets generate --android
npx @capacitor/assets generate --ios
```

This generates:
- `android/app/src/main/res/mipmap-*/ic_launcher.png` (all DPIs)
- `android/app/src/main/res/mipmap-*/ic_launcher_round.png`
- `android/app/src/main/res/drawable-*/splash.png`

---

## Step 4 — Create a Signing Keystore (one-time setup)

```bash
keytool -genkey -v \
  -keystore mctbank-release.keystore \
  -alias mctbank \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Store the keystore file and passwords securely. Never commit to git.**

---

## Step 5 — Configure Signing in Gradle

Edit `frontend/android/app/build.gradle`:

```groovy
android {
    signingConfigs {
        release {
            storeFile     file('/path/to/mctbank-release.keystore')
            storePassword 'YOUR_STORE_PASSWORD'
            keyAlias      'mctbank'
            keyPassword   'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig            signingConfigs.release
            minifyEnabled            true
            shrinkResources          true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

Or use environment variables (recommended for CI):

```groovy
signingConfigs {
    release {
        storeFile     file(System.getenv("KEYSTORE_PATH") ?: "")
        storePassword System.getenv("KEYSTORE_PASSWORD") ?: ""
        keyAlias      System.getenv("KEY_ALIAS")         ?: "mctbank"
        keyPassword   System.getenv("KEY_PASSWORD")      ?: ""
    }
}
```

---

## Step 6 — Build Release APK

```bash
cd frontend/android
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release.apk
```

---

## Step 7 — Build Release AAB (Google Play Store)

```bash
cd frontend/android
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab
```

---

## Step 8 — Verify the Build

```bash
# Check APK is properly signed
apksigner verify --verbose app/build/outputs/apk/release/app-release.apk

# Check APK contents
aapt dump badging app/build/outputs/apk/release/app-release.apk | grep -E "package|label|icon"
```

---

## Step 9 — Install on Device (testing)

```bash
adb install app/build/outputs/apk/release/app-release.apk
```

---

## Vercel Web Deployment

```bash
cd frontend
npm run build
# Deploy via Vercel CLI or push to connected GitHub branch

# Via CLI:
npx vercel --prod
```

---

## Environment Variables Required for Production

### Backend (Render dashboard)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | 64+ char random string |
| `CARD_ENCRYPTION_KEY` | 32-char AES key for card numbers |
| `EMAILJS_SERVICE_ID` | EmailJS service ID |
| `EMAILJS_PUBLIC_KEY` | EmailJS public API key |
| `EMAILJS_PRIVATE_KEY` | EmailJS private API key (recommended) |
| `EMAILJS_TEMPLATE_ID` | OTP template ID |
| `EMAILJS_TEMPLATE_WELCOME` | Welcome email template ID |
| `EMAILJS_TEMPLATE_RESET` | Password reset template ID |
| `EMAILJS_TEMPLATE_TRANSACTION` | Transaction alert template ID |
| `EMAILJS_TEMPLATE_LOGIN_ALERT` | Login alert template ID |
| `ENABLE_EMAIL` | `true` to activate email sending |
| `CLIENT_ORIGIN` | `https://mctbank.online,https://www.mctbank.online,http://localhost` |
| `NODE_ENV` | `production` |

### Frontend (Vercel dashboard)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | `https://core-wallet.onrender.com/api` |

---

## PWA Icons for Web (frontend/public/)

Place these files before deploying to Vercel:
| File | Size | Notes |
|------|------|-------|
| `icon-192.png` | 192×192 | Used for PWA install prompt and home screen |
| `icon-512.png` | 512×512 | Used for splash and high-DPI displays |
| `favicon.ico` | 32×32 | Browser tab icon |

Use navy background (#003087) with the MCT Bank building logo mark centered in white.

---

## Recommended: Amazon SES Migration (Phase 3 future)

When EmailJS rate limits become a bottleneck:

1. Verify `noreply@mctbank.online` in AWS SES
2. Request production access (exit sandbox)
3. Install SDK: `npm install @aws-sdk/client-ses`
4. Replace `emailjs.send()` calls in `backend/utils/email.js` with SES `SendEmailCommand`
5. Use `backend/utils/emailTemplates.js` HTML/text output directly — templates are SES-ready
6. Set `SES_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` in Render env vars
