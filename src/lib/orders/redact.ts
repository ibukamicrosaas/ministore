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
 * Règle : toute lecture de clients.first_name / last_name / phone /
 * whatsapp / email, ou de orders.delivery_address / delivery_zone_name /
 * notes, destinée à un usage marchand (affichage dashboard, export CSV,
 * notification WhatsApp/e-mail, envoi au livreur, push) DOIT passer par les
 * fonctions de ce fichier immédiatement après la requête — avant toute
 * autre utilisation de la donnée. Ne relis jamais ces colonnes brutes pour
 * les montrer, les exporter ou les inclure dans un message. Une fois passée
 * par ces fonctions, la commande retenue ne porte plus l'original : rien de
 * ce qui la consomme ensuite ne peut donc la faire fuiter.
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
