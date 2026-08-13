/**
 * Pourquoi ce fichier existe (voir NOTE_MASQUAGE_COMMANDES.md à la racine du
 * dépôt) : le masquage des coordonnées d'une commande retenue ne peut pas
 * être garanti par RLS ni par une vue Postgres, parce que l'essentiel du
 * code serveur de ce projet lit/écrit via la clé service_role
 * (createAdminClient), qui contourne RLS et les droits par colonne par
 * construction. La seule protection fiable est donc applicative — et elle
 * doit remplacer la vraie valeur À LA SOURCE, pas seulement en restreindre
 * le type. Un type ne fait qu'empêcher un passage de valeur mal typé ; il
 * n'empêche pas `` `Nouvelle commande de ${nom}` `` d'interpoler une vraie
 * valeur dans un gabarit de chaîne, qui compile très bien.
 *
 * RÈGLE — point de passage unique : toute lecture d'une commande destinée à
 * un usage marchand (affichage dashboard, export CSV, notification
 * WhatsApp/e-mail, fiche livreur, push) DOIT passer le résultat par
 * `loadOrderForMerchant()` (ou `loadOrdersForMerchant()` pour une liste)
 * immédiatement après la requête — avant toute autre utilisation. Ne jamais
 * appeler `redactClient`/`redactLocation`/`redactNotes` séparément dans du
 * nouveau code : c'est exactly ce détour, un site qui n'appelle qu'une
 * partie du masquage (ou aucune), qui a produit les fuites déjà trouvées
 * dans ce projet (alerte WhatsApp, widget dashboard, fiche livreur, liste
 * clients). Les fonctions individuelles restent exportées parce que
 * `loadOrderForMerchant` s'appuie dessus et que `isOrderBlocked` seul reste
 * légitime comme garde d'action (bloquer un changement de statut) quand
 * aucune donnée client n'est affichée. Mais pour tout affichage, le seul
 * appel à faire est `loadOrderForMerchant`.
 *
 * Dérogation documentée : `src/app/admin/payments/page.tsx` lit les
 * coordonnées client d'une commande retenue sans passer par ce module.
 * Volontaire — la règle de masquage protège le modèle économique (empêcher
 * un marchand de contourner l'activation en exploitant des coordonnées
 * qu'il n'a pas payé pour voir), pas les données en général. L'équipe
 * TEKKIShop a besoin de voir ces informations pour traiter un incident.
 * Ne pas étendre cette dérogation à un nouveau point de lecture sans la
 * même justification explicite.
 */

export const REDACTED_LABEL = 'Masqué jusqu\'à l\'activation'

export interface HeldGuard {
  is_held: boolean
  released_at: string | null
}

/** true tant que la commande est retenue et n'a pas été libérée par l'activation. */
export function isOrderBlocked(order: HeldGuard): boolean {
  return order.is_held === true && order.released_at === null
}

interface RawClientFields {
  first_name?: string | null
  last_name?:  string | null
  phone?:      string | null
  whatsapp?:   string | null
  email?:      string | null
}

export interface RedactedClient {
  clientName:     string
  clientPhone:    string | null
  clientWhatsapp: string | null
  clientEmail:    string | null
}

/** Remplace les coordonnées du client par des valeurs neutres si la commande est retenue. */
export function redactClient(client: RawClientFields | null | undefined, order: HeldGuard): RedactedClient {
  if (isOrderBlocked(order)) {
    return { clientName: REDACTED_LABEL, clientPhone: null, clientWhatsapp: null, clientEmail: null }
  }
  const name = client ? [client.first_name, client.last_name].filter(Boolean).join(' ') : ''
  return {
    clientName:     name || 'Client inconnu',
    clientPhone:    client?.phone    ?? null,
    clientWhatsapp: client?.whatsapp ?? null,
    clientEmail:    client?.email    ?? null,
  }
}

/** Adresse de livraison, ville, zone — remplacées par null si la commande est retenue. */
export function redactLocation(value: string | null | undefined, order: HeldGuard): string | null {
  return isOrderBlocked(order) ? null : (value ?? null)
}

/** Notes libres du client — peuvent contenir un numéro écrit à la main. */
export function redactNotes(notes: string | null | undefined, order: HeldGuard): string | null {
  return isOrderBlocked(order) ? null : (notes ?? null)
}

interface RawOrderForMerchant extends HeldGuard {
  clients?:            RawClientFields | null
  delivery_address?:   string | null
  delivery_zone_name?: string | null
  notes?:              string | null
  /** Jeton exploitable (fiche livreur) — ne doit jamais quitter le serveur sur une commande retenue. */
  delivery_token?:     string | null
}

type MerchantOrder<T extends RawOrderForMerchant> =
  Omit<T, 'clients' | 'delivery_address' | 'delivery_zone_name' | 'notes' | 'delivery_token'> & {
    blocked:            boolean
    merchantClient:     RedactedClient
    delivery_address:   string | null
    delivery_zone_name: string | null
    notes:              string | null
    delivery_token:     string | null
  }

/**
 * Point de passage unique pour toute lecture de commande à usage marchand —
 * voir la règle en tête de fichier. Remplace en un seul appel les
 * coordonnées client, l'adresse, la zone, les notes et le jeton livreur si
 * la commande est retenue ; ne modifie rien d'autre. `clients` est retiré
 * du résultat (pas juste masqué) : impossible de relire la valeur brute par
 * erreur après ce point, il faut passer par `.merchantClient`.
 */
export function loadOrderForMerchant<T extends RawOrderForMerchant>(order: T): MerchantOrder<T> {
  const blocked = isOrderBlocked(order)
  const { clients, ...rest } = order
  return {
    ...rest,
    blocked,
    merchantClient:     redactClient(clients, order),
    delivery_address:   redactLocation(order.delivery_address, order),
    delivery_zone_name: redactLocation(order.delivery_zone_name, order),
    notes:              redactNotes(order.notes, order),
    delivery_token:     blocked ? null : (order.delivery_token ?? null),
  } as MerchantOrder<T>
}

/** Variante liste de `loadOrderForMerchant` — mêmes garanties, appliquées à chaque ligne. */
export function loadOrdersForMerchant<T extends RawOrderForMerchant>(orders: T[]): MerchantOrder<T>[] {
  return orders.map(loadOrderForMerchant)
}
