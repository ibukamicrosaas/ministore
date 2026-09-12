// JSON.stringify n'échappe jamais `<` — un `</script>` dans une valeur (ex.
// nom ou description de boutique/produit, texte libre marchand) sort du
// <script type="application/ld+json"> et permet d'injecter un vrai <script>
// exécutable sur la page publique (audit sécurité §109, finding critique #2).
// < est équivalent à `<` pour tout parseur JSON, y compris dans une
// balise <script>, donc sans effet sur le SEO/les données structurées.
export function safeJsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
