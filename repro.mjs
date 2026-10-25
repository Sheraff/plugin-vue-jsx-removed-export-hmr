// node repro.mjs
// `A` is exported but not imported by anyone; `B` is rendered.
// Control: edit B -> B is hot-updated.
// Repro: remove `export const A` -> expected: no error (or a full reload).
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const file = new URL('./src/comps.jsx', import.meta.url)
const original = readFileSync(file, 'utf8')
const server = await createServer({ server: { port: 4176, strictPort: true }, logLevel: 'warn' })
await server.listen()
let browser
try {
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH })
  const page = await browser.newPage()
  const logs = []
  page.on('console', (m) => logs.push(`${m.type()}: ${m.text().split('\n')[0]}`))
  await page.goto('http://localhost:4176/')
  await page.waitForSelector('#b')
  await page.evaluate(() => {
    window.__mark = true // lost on a full reload
  })
  writeFileSync(file, original.replace('b v1', 'b v2'))
  await page.waitForFunction(() => document.querySelector('#b').textContent === 'b v2', null, { timeout: 5000 })
  await page.waitForTimeout(1500)
  console.log('control: B hot-updated without a reload:', await page.evaluate(() => window.__mark === true))

  logs.length = 0
  writeFileSync(file, original.replace(/export const A = .*\n/, '').replace('b v1', 'b v2'))
  await page.waitForTimeout(3000)
  console.log('after removing `export const A`:')
  console.log('  full reload happened:', !(await page.evaluate(() => window.__mark === true)))
  console.log('  console:', logs.filter((l) => !l.includes('connect')))
} finally {
  writeFileSync(file, original)
  await browser?.close()
  await server.close()
}
