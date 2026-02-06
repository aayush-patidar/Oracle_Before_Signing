# 🌐 Port Forwarding Guide for OBS

Since your application uses Next.js rewrites, **you only need to forward Port 3000**. The frontend will handle communication with the backend internally.

---

## Option 1: VS Code Built-in (Easiest)

If you just want to test on another device or share with someone temporarily, use VS Code's built-in forwarder.

1.  **Open Ports Tab**:
    *   Press `Ctrl + ~` (tilde) to open the terminal panel.
    *   Click on the **PORTS** tab (next to TERMINAL).
    *   If you don't see it, press `Ctrl + Shift + P` and type `Ports: Focus on Ports View`.

2.  **Add Port**:
    *   Click **Forward a Port**.
    *   Enter `3000` and press Enter.

3.  **Access**:
    *   VS Code will generate a URL like `https://mn123-3000.use.devtunnels.ms`.
    *   Open this URL on your mobile device or share it.
    *   **Note**: You might need to sign in with GitHub to access the tunnel.

---

## Option 2: Using ngrok (Recommended for Demos)

`ngrok` provides a public URL that is accessible by anyone without login screens.

### 1. Install ngrok
If you haven't installed it:
```powershell
choco install ngrok
# OR download from https://ngrok.com/download
```

### 2. Authenticate
(Only needs to be done once)
```powershell
ngrok config add-authtoken <YOUR_TOKEN>
# Get token from https://dashboard.ngrok.com
```

### 3. Share Port 3000
Run this in a **new terminal**:
```powershell
ngrok http 3000
```

### 4. Use the URL
*   Copy the `https://...ngrok-free.app` URL shown in the terminal.
*   The app will work fully (frontend + backend connection) through this single URL.

---

## ⚠️ Important Note
**Do NOT forward port 3001**.
The frontend talks to the backend via `localhost:3001` internally. If you try to open the backend directly via a public URL, the frontend won't know about it unless you change configuration. Keeping it simple (Forward 3000 only) is the correct approach.
