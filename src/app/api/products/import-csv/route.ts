import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_ROWS    = 200
const MAX_NAME    = 200
const MAX_DESC    = 2000
const MAX_CAT     = 100

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')

  for (const line of lines) {
    if (!line.trim()) continue
    const cols: string[] = []
    let cur = ''
    let inQuote = false

    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
        else inQuote = !inQuote
      } else if (c === ',' && !inQuote) {
        cols.push(cur.trim())
        cur = ''
      } else {
        cur += c
      }
    }
    cols.push(cur.trim())
    rows.push(cols)
  }

  return rows
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()
  if (!profile?.shop_id) return NextResponse.json({ error: 'Boutique introuvable.' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Fichier manquant.' }, { status: 400 })
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'Fichier trop volumineux (max 2 Mo).' }, { status: 400 })

  const text = await file.text()
  const allRows = parseCSV(text)
  if (allRows.length < 2) return NextResponse.json({ error: 'CSV vide ou sans données.' }, { status: 400 })

  // Normalise les en-têtes
  const rawHeaders = allRows[0].map(h => h.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))
  const dataRows   = allRows.slice(1).filter(r => r.some(c => c.trim()))

  if (dataRows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Maximum ${MAX_ROWS} produits par import.` }, { status: 400 })
  }

  // Trouver les index des colonnes (tolère plusieurs noms)
  const idx = (names: string[]) => {
    const found = names.map(n => rawHeaders.indexOf(n)).find(i => i !== -1)
    return found ?? -1
  }
  const iName  = idx(['nom', 'name', 'produit'])
  const iPrice = idx(['prix', 'price'])
  const iDesc  = idx(['description', 'desc'])
  const iCat   = idx(['categorie', 'category', 'cat'])
  const iStock = idx(['stock', 'quantite', 'quantity'])
  const iActive = idx(['actif', 'active'])

  if (iName === -1 || iPrice === -1) {
    return NextResponse.json({
      error: 'Colonnes requises manquantes. Le CSV doit avoir au moins "nom" et "prix".',
    }, { status: 400 })
  }

  const admin = createAdminClient()
  const errors: string[] = []
  const toInsert: object[] = []

  for (let i = 0; i < dataRows.length; i++) {
    const row   = dataRows[i]
    const rowNum = i + 2 // ligne 1 = headers

    const name  = row[iName]?.trim()  ?? ''
    const priceRaw = row[iPrice]?.trim().replace(/\s/g, '').replace(',', '.') ?? ''

    if (!name) { errors.push(`Ligne ${rowNum} : nom manquant`); continue }
    if (name.length > MAX_NAME) { errors.push(`Ligne ${rowNum} : nom trop long (max ${MAX_NAME} caractères)`); continue }

    const price = parseInt(priceRaw, 10)
    if (isNaN(price) || price < 0) { errors.push(`Ligne ${rowNum} : prix invalide "${priceRaw}"`); continue }

    const description = iDesc !== -1 ? (row[iDesc]?.trim().slice(0, MAX_DESC) ?? null) : null
    const category    = iCat  !== -1 ? (row[iCat]?.trim().slice(0, MAX_CAT)  || null) : null
    const stockRaw    = iStock !== -1 ? row[iStock]?.trim() : ''
    const stock_count = stockRaw && stockRaw !== '' && !isNaN(Number(stockRaw))
      ? Math.max(0, parseInt(stockRaw, 10))
      : null
    const activeRaw = iActive !== -1 ? row[iActive]?.trim().toLowerCase() : '1'
    const is_active = !['0', 'false', 'non', 'no', 'inactive'].includes(activeRaw ?? '')

    toInsert.push({
      shop_id:     profile.shop_id,
      name,
      price,
      description,
      category,
      stock_count,
      is_active,
      display_order: 0,
    })
  }

  if (errors.length > 0 && toInsert.length === 0) {
    return NextResponse.json({ error: 'Aucun produit valide trouvé.', details: errors }, { status: 400 })
  }

  const { error: insertError } = await admin
    .from('products')
    .insert(toInsert as never[])

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({
    imported: toInsert.length,
    skipped:  errors.length,
    errors:   errors.slice(0, 10),
  })
}
