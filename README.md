# SVG to PDF

Installable, offline-first web app for converting SVG documents to PDFs in the browser.

## Development

This project uses packages from GitHub Packages. The local `.npmrc` expects a `GITHUB_TOKEN` environment variable with access to the `@turbodt` scope.

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

The WASM converter is loaded from `@turbodt/svg-to-pdf/svg-to-pdf.wasm`, so builds do not depend on local C repository output.

## Offline Use

The app is configured as a PWA with `vite-plugin-pwa`. After the first successful load, the app shell, fonts, icons, JavaScript, CSS, and WASM converter are precached so the installed app can run offline.
