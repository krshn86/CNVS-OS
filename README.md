# CNVS OS Desktop

CNVS OS running as a native Windows desktop app via Tauri.

## Files
- `CNVS_OS_v9.html` — main CNVS OS app
- `src/` — Tauri frontend entry
- `src-tauri/` — Tauri native shell
- `package.json` — npm scripts

## One-time setup (Windows)
1. Install [Node.js LTS](https://nodejs.org)
2. Install [Rust](https://rustup.rs)
3. Install [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) — select **Desktop development with C++**
4. Install [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

## Run
```powershell
npm install
npx tauri dev
```

## Build (creates .exe installer)
```powershell
npm run build
```
