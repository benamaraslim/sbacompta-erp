import puppeteer from 'puppeteer'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '..', 'docs', 'screenshots')
mkdirSync(OUTPUT_DIR, { recursive: true })

const BASE_URL = 'http://localhost:3000'

const PAGES = [
  { name: 'dashboard',         path: '/',                    title: 'Tableau de bord' },
  { name: 'finance-invoices',  path: '/finance/invoices',    title: 'Finance — Factures' },
  { name: 'finance-reports',   path: '/finance/reports',     title: 'Finance — Rapports' },
  { name: 'hr-employees',      path: '/hr/employees',        title: 'RH — Employés' },
  { name: 'hr-leaves',         path: '/hr/leaves',           title: 'RH — Congés' },
  { name: 'inventory-products',path: '/inventory/products',  title: 'Stock — Produits' },
  { name: 'sales-customers',   path: '/sales/customers',     title: 'Ventes — Clients' },
  { name: 'sales-orders',      path: '/sales/orders',        title: 'Ventes — Commandes' },
]

;(async () => {
  console.log('📸 Capturing screenshots...')
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })

  for (const { name, path, title } of PAGES) {
    try {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle0', timeout: 15000 })
      await new Promise(r => setTimeout(r, 800))
      const file = join(OUTPUT_DIR, `${name}.png`)
      await page.screenshot({ path: file, fullPage: false })
      console.log(`  ✅ ${title} → docs/screenshots/${name}.png`)
    } catch (e) {
      console.log(`  ❌ ${title}: ${e.message}`)
    }
  }

  await browser.close()
  console.log('\n✨ Done! Screenshots saved in docs/screenshots/')
})()
