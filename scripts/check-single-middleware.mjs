#!/usr/bin/env node
// Next.js accepte middleware.ts/proxy.ts à la racine ET dans src/, sans erreur
// s'il en trouve plusieurs — il en charge un silencieusement et ignore l'autre
// (contrairement au conflit middleware.ts + proxy.ts, qui lève une erreur
// bloquante explicite). C'est exactement ce qui a rendu src/middleware.ts mort
// pendant deux mois de correctifs jamais livrés — voir REPRISE.md §41.
// Ce script échoue bruyamment au build si ça se reproduit.

import { existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const candidates = [
  'middleware.ts', 'middleware.js',
  'src/middleware.ts', 'src/middleware.js',
  'proxy.ts', 'proxy.js',
  'src/proxy.ts', 'src/proxy.js',
]

const found = candidates.filter(c => existsSync(join(root, c)))

if (found.length > 1) {
  console.error('\n✖ Plusieurs fichiers middleware/proxy détectés — Next.js en charge un SEUL, silencieusement, sans erreur :')
  found.forEach(f => console.error(`  - ${f}`))
  console.error('\nSupprime tous les fichiers sauf un avant de builder. Voir REPRISE.md §41.\n')
  process.exit(1)
}

if (found.length === 0) {
  console.error('\n✖ Aucun fichier middleware/proxy trouvé — attendu : middleware.ts (racine).\n')
  process.exit(1)
}

console.log(`✓ Un seul fichier middleware/proxy détecté : ${found[0]}`)
