import { createAdminClient } from '@/lib/supabase/admin'
import { addCountryManager, removeCountryManager } from '@/lib/actions/admin-country-managers'
import { Globe, Trash2, UserPlus } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const metadata = { title: 'Country Managers — TEKKIShop Admin' }

const SUPPORTED_COUNTRIES: Record<string, { name: string; flag: string }> = {
  SN: { name: 'Sénégal',         flag: '🇸🇳' },
  CI: { name: "Côte d'Ivoire",   flag: '🇨🇮' },
  BF: { name: 'Burkina Faso',    flag: '🇧🇫' },
  ML: { name: 'Mali',            flag: '🇲🇱' },
  TG: { name: 'Togo',            flag: '🇹🇬' },
  BJ: { name: 'Bénin',           flag: '🇧🇯' },
  CM: { name: 'Cameroun',        flag: '🇨🇲' },
  GN: { name: 'Guinée',          flag: '🇬🇳' },
  MR: { name: 'Mauritanie',      flag: '🇲🇷' },
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields:  'Numéro de téléphone et pays sont requis.',
  lookup_failed:   'Impossible de rechercher cet utilisateur.',
  insert_failed:   'Erreur lors de l\'ajout. Réessaie.',
  already_exists:  'Ce manager a déjà accès à ce pays.',
  missing_id:      'Identifiant manquant.',
  user_not_found:  'Aucun compte TEKKIShop trouvé avec ce numéro.',
}

type RawManager = {
  id: string
  user_id: string
  country: string
  created_at: string
}

export default async function CountryManagersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params  = await searchParams
  const error   = params.error
  const success = params.success
  const phone   = params.phone

  const admin = createAdminClient()

  const { data: rawManagers } = await admin
    .from('country_managers' as never)
    .select('id, user_id, country, created_at')
    .order('created_at', { ascending: false }) as { data: RawManager[] | null }

  const managers = rawManagers ?? []

  // Récupère le téléphone via l'API admin pour chaque manager
  const userPhones: Record<string, string> = {}
  await Promise.all(
    managers.map(async (m) => {
      const { data: { user } } = await admin.auth.admin.getUserById(m.user_id)
      if (user?.phone) userPhones[m.user_id] = user.phone
    }),
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Country Managers</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Gérer les licences d&apos;exploitation par pays — chaque manager accède à son dashboard pays.
        </p>
      </div>

      {/* Alertes */}
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {ERROR_MESSAGES[error] ?? 'Une erreur est survenue.'}
          {error === 'user_not_found' && phone && (
            <span className="font-semibold"> ({decodeURIComponent(phone)})</span>
          )}
        </div>
      )}
      {success === 'added' && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          ✅ Accès accordé avec succès.
        </div>
      )}
      {success === 'removed' && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Accès retiré.
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">

        {/* ── Liste des managers ─────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <Globe className="h-4 w-4 text-sky-500" />
            <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Accès actifs ({managers.length})
            </p>
          </div>

          {managers.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Globe className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Aucun country manager pour l&apos;instant.</p>
              <p className="text-xs text-gray-300 mt-1">Utilise le formulaire pour en ajouter un.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {managers.map((m) => {
                const country = SUPPORTED_COUNTRIES[m.country]
                return (
                  <div key={m.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0">{country?.flag ?? '🌍'}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {userPhones[m.user_id] ?? m.user_id}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-sky-600 bg-sky-50 rounded-full px-2 py-0.5">
                            {country?.name ?? m.country}
                          </span>
                          <span className="text-xs text-gray-400">
                            Ajouté le {format(new Date(m.created_at), 'd MMM yyyy', { locale: fr })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <form action={removeCountryManager}>
                      <input type="hidden" name="id" value={m.id} />
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                        title="Retirer l'accès"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Retirer
                      </button>
                    </form>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Formulaire ajout ──────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <UserPlus className="h-4 w-4 text-sky-500" />
            <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Ajouter un accès</p>
          </div>

          <form action={addCountryManager} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-gray-600 mb-1.5">
                Téléphone du Country Manager
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="+228 90 00 00 00"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 transition"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Format international — le manager doit déjà avoir un compte TEKKIShop.
              </p>
            </div>

            <div>
              <label htmlFor="country" className="block text-xs font-semibold text-gray-600 mb-1.5">
                Pays géré
              </label>
              <select
                id="country"
                name="country"
                required
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 transition"
              >
                <option value="">— Sélectionner un pays —</option>
                {Object.entries(SUPPORTED_COUNTRIES).map(([code, { name, flag }]) => (
                  <option key={code} value={code}>{flag} {name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-sky-500 py-2.5 text-sm font-bold text-white hover:bg-sky-600 transition-colors shadow-sm"
            >
              Accorder l&apos;accès
            </button>
          </form>

          <div className="mt-6 rounded-lg bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">Ce que ça donne au manager :</p>
            <ul className="space-y-1.5">
              {[
                'Accès au dashboard /country-admin',
                'Vue filtrée : boutiques de son pays uniquement',
                'Aucun accès aux autres pays ni aux données financières globales',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-[11px] text-gray-500">
                  <span className="text-sky-400 font-bold mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
