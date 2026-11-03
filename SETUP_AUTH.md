# Firebase & GitHub Authentication Setup Guide

This guide will walk you through setting up Firebase Authentication with GitHub OAuth for your DSA Tracker app.

## Prerequisites
- A Google account (for Firebase Console)
- A GitHub account (for creating the OAuth Application)

---

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Enter a project name (e.g., `dsa-tracker`) and click **Continue**.
4. Choose whether to enable Google Analytics (not required for this project, you can turn it off) and click **Create project**.
5. Once your project is ready, click **Continue**.

---

## Step 2: Register a Web App in Firebase

1. On the project overview homepage, click the **Web icon (`</>`)** to add an app.
2. Enter an app nickname (e.g., `dsa-tracker-web`).
3. (Optional) Check the box for Firebase Hosting if you want to deploy later.
4. Click **Register app**.
5. You will see your Firebase SDK configuration. You only need the values for **ApiKey**, **AuthDomain**, and **ProjectId**.
6. Create a `.env` file in the root directory of your project (copy from `.env.example`) and fill in those three values:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key-from-firebase
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   ```

---

## Step 3: Enable GitHub Authentication in Firebase

1. In the Firebase left-hand menu, go to **Build** → **Authentication**.
2. Click **Get started**.
3. Under the **Sign-in method** tab, click **Add new provider** and select **GitHub**.
4. Toggle the switch to **Enable**.
5. You will see an authorization callback URL at the bottom (e.g., `https://your-project-id.firebaseapp.com/__/auth/handler`). **Copy this URL** as you will need it for the GitHub step next.
6. Keep this window open.

---

## Step 4: Create a GitHub OAuth App

1. Log into GitHub and go to [GitHub Developer Settings](https://github.com/settings/developers).
2. Click **New OAuth App**.
3. Fill in the details:
   - **Application name**: `DSA Tracker` (or whatever you prefer)
   - **Homepage URL**: `http://localhost:5173` (or the URL where your app runs locally)
   - **Authorization callback URL**: Paste the callback URL you copied from the Firebase console in Step 3.
4. Click **Register application**.
5. You will see your **Client ID**. Copy it.
6. Click **Generate a new client secret**. Copy the generated client secret (Note: it will only be shown once!).

---

## Step 5: Finish Firebase Configuration

1. Go back to your Firebase Console page from Step 3.
2. Paste the **Client ID** and **Client Secret** you got from GitHub into their respective fields.
3. Click **Save**.

---

## Step 6: Start Your App

1. Ensure your `.env` file is set up in the root of the project folder:
   ```env
   VITE_FIREBASE_API_KEY=your-actual-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-actual-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-actual-project-id
   ```
2. Run `npm run dev` to start the local Vite development server.
3. Open your browser and navigate to the local development URL (usually `http://localhost:5173`).
4. Click **Continue with GitHub** to log in and start tracking your DSA journey!
