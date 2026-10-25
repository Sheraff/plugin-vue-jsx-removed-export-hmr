# plugin-vue-jsx: removing an exported component throws in the HMR accept handler

Issue: https://github.com/vitejs/vite-plugin-vue/issues/866

`src/comps.jsx` exports `A` (unused) and `B` (rendered). `repro.mjs` edits `B` (control), then removes
`export const A`.

```sh
npm install
npx playwright install chromium   # or set CHROME_PATH
npm run repro
```

Output with @vitejs/plugin-vue-jsx 5.1.6:

```
control: B hot-updated without a reload: true
after removing `export const A`:
  full reload happened: false
  console: [
  "error: TypeError: Cannot use 'in' operator to search for 'render' in undefined",
  'warning: [HMR] Something went wrong during Vue component hot-reload. Full reload required.',
  'debug: [vite] hot updated: /src/comps.jsx'
]
```

Expected: no error; the update is invalidated (full reload).

Manual steps: `npx vite`, open the page, delete the `export const A` line in `src/comps.jsx`, check the console.
