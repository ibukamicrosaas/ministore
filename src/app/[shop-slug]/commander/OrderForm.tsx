'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2, ChevronDown, ChevronLeft, Package, MapPin, ShoppingBag, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import type { ProductVariant, DeliveryZone } from '@/types'
import { trackMetaEvent } from '@/components/pwa/MetaPixelProvider'
import { formatPrice } from '@/lib/utils/country-groups'
import type { ShopCurrency } from '@/lib/utils/country-groups'
import { OrderSummary } from '@/components/shop/OrderSummary'

const COUNTRIES = [
  // Afrique
  { code: 'SN', flag: '🇸🇳', dial: '+221', name: 'Sénégal' },
  { code: 'CI', flag: '🇨🇮', dial: '+225', name: "Côte d'Ivoire" },
  { code: 'TG', flag: '🇹🇬', dial: '+228', name: 'Togo' },
  { code: 'BJ', flag: '🇧🇯', dial: '+229', name: 'Bénin' },
  { code: 'BK', flag: '🇧🇫', dial: '+226', name: 'Burkina Faso' },
  { code: 'ML', flag: '🇲🇱', dial: '+223', name: 'Mali' },
  // Europe & Canada
  { code: 'FR', flag: '🇫🇷', dial: '+33',  name: 'France' },
  { code: 'BE', flag: '🇧🇪', dial: '+32',  name: 'Belgique' },
  { code: 'LU', flag: '🇱🇺', dial: '+352', name: 'Luxembourg' },
  { code: 'CH', flag: '🇨🇭', dial: '+41',  name: 'Suisse' },
  { code: 'CA', flag: '🇨🇦', dial: '+1',   name: 'Canada' },
]

const PHONE_PLACEHOLDERS: Record<string, string> = {
  '+221': '77 000 00 00',    // SN — 8 chiffres
  '+225': '07 00 00 00 00',  // CI — 10 chiffres
  '+228': '90 00 00 00',     // TG — 8 chiffres
  '+229': '97 00 00 00',     // BJ — 8 chiffres
  '+226': '70 00 00 00',     // BF — 8 chiffres
  '+223': '70 00 00 00',     // ML — 8 chiffres
  '+33':  '6 00 00 00 00',   // FR — mobile 9 chiffres
  '+32':  '470 00 00 00',    // BE — mobile 9 chiffres
  '+352': '621 000 000',     // LU — mobile
  '+41':  '76 000 00 00',    // CH — mobile 9 chiffres
  '+1':   '514 000 0000',    // CA — 10 chiffres
}

// Titre de section — sans numérotation (corrige 3.1 : le stepper affichait `step`
// mais les puces de section étaient écrites en dur, trois sections "1" à la fois).
function SectionTitle({ label }: { label: string }) {
  return (
    <p className="mb-4 text-sm font-bold text-gray-900" style={{ fontFamily: 'var(--lv6-display, "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif)' }}>
      {label}
    </p>
  )
}

function RadioCard({
  checked,
  primaryColor,
  children,
}: {
  checked: boolean
  primaryColor: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
        checked ? '' : 'border-gray-200 bg-white'
      }`}
      style={checked ? { borderColor: primaryColor, backgroundColor: `color-mix(in srgb, ${primaryColor} 5%, white)` } : {}}
    >
      <div
        className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center"
        style={checked ? { borderColor: primaryColor } : { borderColor: '#d1d5db' }}
      >
        {checked && (
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
        )}
      </div>
      {children}
    </div>
  )
}

function PhoneInput({
  value,
  onChange,
  dialCode,
  onDialChange,
  placeholder,
  countries,
}: {
  value: string
  onChange: (v: string) => void
  dialCode: string
  onDialChange: (d: string) => void
  placeholder: string
  countries: typeof COUNTRIES
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const selected = countries.find((c) => c.dial === dialCode) ?? countries[0]

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  return (
    <div className="flex rounded-xl border border-gray-200 bg-white focus-within:border-gray-300">
      <div className="relative shrink-0 border-r border-gray-200" ref={wrapRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-full items-center gap-1.5 bg-gray-50 px-3 text-sm font-medium text-gray-700 rounded-l-xl"
        >
          <span className="text-base leading-none">{selected.flag}</span>
          <span>{selected.dial}</span>
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </button>

        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            {countries.map((c) => {
              const isSelected = c.dial === dialCode
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onDialChange(c.dial); setOpen(false) }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                    isSelected ? 'bg-gray-50 font-semibold' : ''
                  }`}
                >
                  <span className="text-xl leading-none">{c.flag}</span>
                  <span className="flex-1 text-left text-gray-800">{c.name}</span>
                  <span className="font-mono text-xs text-gray-500">{c.dial}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-3 text-sm outline-none bg-transparent"
      />
    </div>
  )
}

interface ProductOption {
  id: string
  name: string
  price: number
  photo: string | null
  variants: ProductVariant[] | null
  deposit_percentage: number | null
  stock_count: number | null
  customization_enabled: boolean
  customization_label: string | null
  quantity_discounts: { min_qty: number; discount_pct: number }[] | null
  product_type: 'physical' | 'digital'
}

interface OrderItem {
  product_id: string
  variant_label: string | null
  quantity: number
  customization_note: string
}

interface Props {
  shopId: string
  shopSlug: string
  shopName: string
  shopLogoUrl: string | null
  shopCity: string | null
  shopCountry: string
  shopCurrency: ShopCurrency
  primaryColor: string
  products: ProductOption[]

  deliveryOptions: { home_delivery: boolean; store_pickup: boolean }
  shopDepositPct: number
  acceptOnlinePayment: boolean
  acceptCashOnDelivery: boolean
  deliveryZones: DeliveryZone[]
  targetCountries: string[] | null
  preselectedProductId: string | null
  preselectedVariant: string | null
  preselectedQuantity?: number
  basePath: string
  acceptingOrders?: boolean
}

export function OrderForm({
  shopId,
  shopSlug,
  shopName,
  shopLogoUrl,
  shopCity,
  shopCountry,
  shopCurrency,
  primaryColor,
  products,

  deliveryOptions,
  shopDepositPct,
  acceptOnlinePayment,
  acceptCashOnDelivery,
  deliveryZones,
  acceptingOrders = true,
  targetCountries,
  preselectedProductId,
  preselectedVariant,
  preselectedQuantity = 1,
  basePath,
}: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const pendingOrderBody = useRef<Record<string, unknown> | null>(null)
  const [errors, setErrors] = useState<{
    firstName?: string
    phone?: string
    address?: string
    email?: string
  }>({})

  // Garde anti-ghost-click : un tap juste après que la page devient interactive
  // (rebond tactile Safari/Chrome Android) ne doit pas déclencher un submit.
  // Ancrée sur le montage du composant — la page ne comporte plus d'étapes
  // dont la transition pourrait servir de point d'ancrage (§5 de la spec).
  const justMountedRef = useRef(true)
  useEffect(() => {
    const t = setTimeout(() => { justMountedRef.current = false }, 400)
    return () => clearTimeout(t)
  }, [])

  // Filtrer les pays selon les marchés cibles de la boutique
  const availableCountries = targetCountries && targetCountries.length > 0
    ? COUNTRIES.filter(c => targetCountries.includes(c.code))
    : COUNTRIES

  const defaultDial = (availableCountries.find((c) => c.code === shopCountry) ?? availableCountries[0])?.dial ?? '+221'
  const CART_KEY    = `tekki_cart_${shopId}`

  const makeItem = (productId?: string, variantLabel?: string | null, qty = 1): OrderItem => ({
    product_id: productId ?? products[0]?.id ?? '',
    variant_label: variantLabel ?? null,
    quantity: qty,
    customization_note: '',
  })

  type SavedCart = { items?: OrderItem[]; firstName?: string; phoneNum?: string; phoneDial?: string; address?: string; _ts?: number }

  // Fonctions panier — appelées dans des handlers (événements), jamais pendant le render
  function saveCart(patch: Partial<SavedCart>) {
    try {
      const raw  = localStorage.getItem(CART_KEY)
      const prev = raw ? (JSON.parse(raw) as SavedCart) : {}
      localStorage.setItem(CART_KEY, JSON.stringify({ ...prev, ...patch, _ts: Date.now() }))
    } catch {}
  }

  function clearCart() {
    try { localStorage.removeItem(CART_KEY) } catch {}
  }

  // Lazy initializer : s'exécute une seule fois à l'init, jamais pendant un re-render
  const [saved] = useState<SavedCart>(() => {
    try {
      const raw = localStorage.getItem(CART_KEY)
      if (!raw) return {}
      const data = JSON.parse(raw) as SavedCart
      const ts   = typeof data._ts === 'number' ? data._ts : 0
      if (Date.now() - ts > 24 * 60 * 60 * 1000) { localStorage.removeItem(CART_KEY); return {} }
      return data
    } catch { return {} }
  })

  const [items, setItems] = useState<OrderItem[]>(
    saved.items?.length ? saved.items : [makeItem(preselectedProductId ?? undefined, preselectedVariant, preselectedQuantity)]
  )

  // InitiateCheckout : déclenché une seule fois à l'ouverture du formulaire
  useEffect(() => {
    trackMetaEvent('InitiateCheckout')
  }, [])
  const [firstName, setFirstName] = useState(saved.firstName ?? '')
  const [phoneDial, setPhoneDial] = useState(saved.phoneDial ?? defaultDial)
  const [phoneNum, setPhoneNum] = useState(saved.phoneNum ?? '')
  const [sameWa, setSameWa] = useState(true)
  const [waDial, setWaDial] = useState(defaultDial)
  const [waNum, setWaNum] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [deliveryType, setDeliveryType] = useState<'home_delivery' | 'store_pickup'>(
    deliveryOptions.home_delivery ? 'home_delivery' : 'store_pickup',
  )
  const [selectedZoneId, setSelectedZoneId] = useState<string>(deliveryZones[0]?.id ?? '')
  const [showAllZones, setShowAllZones]     = useState(false)
  const ZONES_VISIBLE = 5
  const [address, setAddress] = useState(saved.address ?? '')
  const [notes, setNotes] = useState('')
  // Premier article en mode "carte confirmée" si arrivé depuis une page produit
  const [firstItemLocked, setFirstItemLocked] = useState(!!preselectedProductId)
  // Choix de paiement explicite à 3 valeurs (lot C, §7 de la spec) — remplace
  // l'ancien état binaire où l'acompte était déduit en silence dès que "online"
  // était choisi et qu'un deposit_percentage était configuré. Défaut : même ordre
  // de préférence qu'avant (cash à la livraison si actif, sinon en ligne complet).
  // Si aucun mode n'est actif, cette valeur ne sera jamais soumise — hasAnyPaymentMethod
  // (plus bas) bloque la confirmation avant ce cas-là.
  const [paymentChoice, setPaymentChoice] = useState<'online_full' | 'online_deposit' | 'on_delivery'>(
    acceptCashOnDelivery ? 'on_delivery' : 'online_full'
  )
  // Vrai une fois qu'un article digital a forcé le paiement en ligne complet — la
  // bascule reste acquise même si l'article digital est ensuite retiré (décision
  // explicite, pas de retour automatique au choix précédent).
  const [switchedForDigital, setSwitchedForDigital] = useState(false)
  // Code promo
  const [promoCode, setPromoCode]         = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoStatus, setPromoStatus]     = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [promoError, setPromoError]       = useState('')

  async function applyPromoCode() {
    const trimmed = promoCode.trim().toUpperCase()
    if (!trimmed) return
    setPromoStatus('checking')
    try {
      const res  = await fetch(`/api/shops/check-promo?shopId=${shopId}&code=${encodeURIComponent(trimmed)}`)
      const data = await res.json() as { valid: boolean; discount_pct?: number; error?: string }
      if (data.valid && data.discount_pct) {
        setPromoDiscount(data.discount_pct)
        setPromoStatus('valid')
        setPromoError('')
      } else {
        setPromoDiscount(0)
        setPromoStatus('invalid')
        setPromoError(data.error ?? 'Code invalide')
      }
    } catch {
      setPromoStatus('invalid')
      setPromoError('Erreur réseau')
    }
  }

  function getProduct(id: string) {
    return products.find((p) => p.id === id)
  }

  // isDigital disparaît au profit de deux informations dérivées du panier réel,
  // recalculées à chaque changement d'article (§8 de la spec, corrige 3.11 — avant,
  // isDigital était figé côté serveur sur le seul produit présélectionné).
  const hasDigitalItem  = items.some(it => getProduct(it.product_id)?.product_type === 'digital')
  const hasPhysicalItem = items.some(it => getProduct(it.product_id)?.product_type !== 'digital')

  // Bascule annoncée, jamais subie (§8) : un fichier dans le panier force le
  // paiement en ligne complet — si l'acheteur avait choisi autre chose, on le
  // fait basculer et on garde une trace pour expliquer pourquoi à l'écran.
  useEffect(() => {
    if (hasDigitalItem && paymentChoice !== 'online_full') {
      setPaymentChoice('online_full')
      setSwitchedForDigital(true)
    }
  }, [hasDigitalItem, paymentChoice])

  function updateItem(index: number, patch: Partial<OrderItem>) {
    setItems((prev) => {
      const next = prev.map((it, i) => {
        if (i !== index) return it
        const updated = { ...it, ...patch }
        if (patch.product_id) updated.variant_label = null
        return updated
      })
      saveCart({ items: next })
      return next
    })
  }

  function addItem() {
    if (items.length >= 5) {
      toast.error('Maximum 5 articles par commande.')
      return
    }
    setItems((prev) => [...prev, makeItem()])
  }

  function removeItem(index: number) {
    if (items.length === 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const selectedZone = deliveryZones.find(z => z.id === selectedZoneId) ?? null
  const deliveryPrice = (deliveryType === 'home_delivery' && deliveryZones.length > 0 && selectedZone)
    ? selectedZone.price
    : 0

  function computeDeposit() {
    const rawDeposit = items.reduce((sum, it) => {
      const p = getProduct(it.product_id)
      if (!p) return sum
      const pct = p.deposit_percentage != null ? p.deposit_percentage : shopDepositPct
      if (pct === 0) return sum
      const basePrice   = getItemBasePrice(p, it.variant_label)
      const qtyDiscount = getQtyDiscountPct(p, it.quantity)
      const price       = qtyDiscount > 0 ? Math.floor(basePrice * (100 - qtyDiscount) / 100) : basePrice
      return sum + Math.floor((price * it.quantity * pct) / 100)
    }, 0)
    // Appliquer la remise promo à l'acompte (cohérent avec le serveur)
    return promoDiscount > 0 ? Math.floor(rawDeposit * (100 - promoDiscount) / 100) : rawDeposit
  }

  function getItemBasePrice(p: ProductOption, variantLabel: string | null): number {
    if (variantLabel && p.variants) {
      const v = p.variants.find(v => v.label === variantLabel)
      if (v) return v.price
    }
    return p.price
  }

  function getQtyDiscountPct(p: ProductOption, qty: number): number {
    if (!p.quantity_discounts?.length) return 0
    const applicable = p.quantity_discounts
      .filter(d => qty >= d.min_qty)
      .sort((a, b) => b.min_qty - a.min_qty)
    return applicable[0]?.discount_pct ?? 0
  }

  const itemsSubtotal  = items.reduce((sum, it) => {
    const p = getProduct(it.product_id)
    if (!p) return sum
    const basePrice  = getItemBasePrice(p, it.variant_label)
    const discountPct = getQtyDiscountPct(p, it.quantity)
    const unitPrice  = discountPct > 0 ? Math.floor(basePrice * (100 - discountPct) / 100) : basePrice
    return sum + unitPrice * it.quantity
  }, 0)
  const promoAmount    = promoDiscount > 0 ? Math.floor(itemsSubtotal * promoDiscount / 100) : 0
  const total          = itemsSubtotal - promoAmount + deliveryPrice
  const subtotal       = itemsSubtotal + deliveryPrice  // pour l'affichage du sous-total si besoin
  void subtotal

  // Décomposition pour le relevé (lot B) — valeurs d'affichage dérivées, ne changent
  // ni `itemsSubtotal`, ni `promoAmount`, ni `total` ci-dessus, tous calculés
  // exactement comme avant. rawSubtotal (prix plein, avant remise quantité) sert
  // de "Sous-total" affiché ; qtyDiscountAmount est la différence avec itemsSubtotal
  // (déjà remisé quantité) — reconstitue le total à l'identique :
  // rawSubtotal - qtyDiscountAmount - promoAmount + deliveryPrice === total.
  const rawSubtotal = items.reduce((sum, it) => {
    const p = getProduct(it.product_id)
    if (!p) return sum
    return sum + getItemBasePrice(p, it.variant_label) * it.quantity
  }, 0)
  const qtyDiscountAmount = rawSubtotal - itemsSubtotal

  // Acompte : montant inchangé (computeDeposit(), même calcul qu'avant le lot C) —
  // seule la façon dont il est proposé change. hasDeposit détermine si le choix
  // explicite "Payer un acompte" existe (§7) ; avant, cette même valeur décidait
  // en silence si "payer maintenant" devenait un acompte sans que l'acheteur l'ait demandé.
  const depositAmount = computeDeposit()
  const hasDeposit = depositAmount > 0 && depositAmount < total
  // Panier mixte : l'acompte ne couvre que les articles qui en ont un configuré
  // (computeDeposit() les ignore déjà, comportement hérité, pas changé ici) — ce
  // drapeau sert uniquement à afficher "Acompte partiel" quand ce n'est pas la
  // totalité du panier qui est concernée.
  const allItemsHaveDeposit = items.length > 0 && items.every(it => {
    const p = getProduct(it.product_id)
    if (!p) return true
    const pct = p.deposit_percentage != null ? p.deposit_percentage : shopDepositPct
    return pct > 0
  })

  // Composition des choix disponibles (§7) — un article digital exclut cash et
  // acompte quel que soit le reste du panier (§8), géré par useEffect plus haut
  // qui force paymentChoice à 'online_full' dans ce cas.
  const paymentChoices: ('online_full' | 'online_deposit' | 'on_delivery')[] = []
  if (acceptOnlinePayment) paymentChoices.push('online_full')
  if (!hasDigitalItem && acceptCashOnDelivery) paymentChoices.push('on_delivery')
  if (!hasDigitalItem && acceptOnlinePayment && acceptCashOnDelivery && hasDeposit) paymentChoices.push('online_deposit')
  const hasAnyPaymentMethod = paymentChoices.length > 0

  // "Ce que tu paies maintenant" / "à la livraison" (§6 de la spec).
  const amountNow = paymentChoice === 'online_deposit' ? depositAmount
    : paymentChoice === 'online_full' ? total
    : 0
  const amountLater = paymentChoice === 'online_deposit' ? total - depositAmount
    : paymentChoice === 'on_delivery' ? total
    : 0

  const fullPhone = `${phoneDial}${phoneNum}`
  const fullWhatsapp = sameWa ? fullPhone : `${waDial}${waNum}`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Ghost-click guard : ignorer tout submit si la page vient tout juste de devenir interactive
    if (justMountedRef.current) return

    const newErrors: typeof errors = {}
    if (!firstName.trim()) newErrors.firstName = 'Votre nom est obligatoire.'
    if (!phoneNum.trim())  newErrors.phone     = 'Votre téléphone est obligatoire.'
    if (hasPhysicalItem && deliveryType === 'home_delivery' && !address.trim())
      newErrors.address = "L'adresse de livraison est obligatoire."
    // Panier 100% digital : l'e-mail devient obligatoire (§8) — c'est le seul moyen
    // de retrouver son fichier hors de cette session. Validation client uniquement
    // pour ce lot, sur décision explicite — pas de renfort côté serveur ici.
    if (!hasPhysicalItem && hasDigitalItem && !clientEmail.trim())
      newErrors.email = "L'e-mail est obligatoire pour un achat numérique."

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      const firstErrorField = document.querySelector('[data-error-anchor]')
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setErrors({})

    for (const it of items) {
      const p = getProduct(it.product_id)
      if (p?.stock_count === 0) {
        toast.error(`${p.name} est en rupture de stock.`)
        return
      }
      if (p?.stock_count != null && it.quantity > p.stock_count) {
        toast.error(`Stock insuffisant pour ${p.name} (max ${p.stock_count}).`)
        return
      }
      if (p?.customization_enabled && !it.customization_note.trim()) {
        const label = p.customization_label || 'personnalisation'
        toast.error(`Veuillez saisir le texte de ${label.toLowerCase()} pour "${p.name}".`)
        return
      }
    }

    const body = {
      shopId,
      items: items.map((it) => {
        const p = getProduct(it.product_id)!
        let price = p.price
        if (it.variant_label && p.variants) {
          const v = p.variants.find((v) => v.label === it.variant_label)
          if (v) price = v.price
        }
        return {
          product_id: it.product_id,
          product_name: p.name,
          variant_label: it.variant_label ?? null,
          unit_price: price,
          quantity: it.quantity,
          customization_note: it.customization_note.trim() || null,
        }
      }),
      delivery_date: null,
      delivery_type: hasPhysicalItem ? deliveryType : 'store_pickup',
      delivery_address: (hasPhysicalItem && deliveryType === 'home_delivery') ? address.trim() : null,
      client_first_name: firstName.trim(),
      client_phone: fullPhone,
      client_whatsapp: fullWhatsapp,
      client_email: clientEmail.trim() || null,
      notes: notes.trim() || null,
      delivery_zone_name: (deliveryType === 'home_delivery' && selectedZone) ? selectedZone.name : null,
      delivery_price: deliveryPrice,
      promo_code: promoStatus === 'valid' ? promoCode.trim().toUpperCase() : null,
      // Les 4 valeurs envoyées au serveur restent celles d'aujourd'hui (§7 de la
      // spec) — seul paymentChoice, l'état client, est nouveau. Le cas digital sans
      // paiement en ligne (ancien repli 'on_site') n'est plus atteignable : ces
      // produits sont désormais désactivés dans le sélecteur si !acceptOnlinePayment.
      payment_type: paymentChoice === 'online_full' ? 'online_full'
        : paymentChoice === 'online_deposit' ? 'online_deposit'
        : deliveryType === 'home_delivery' ? 'on_delivery' : 'on_site',
    }

    // Pour les paiements en ligne (acompte ou complet), afficher le modal d'engagement
    // avant de soumettre — réduit les commandes fantômes.
    const willPayOnline = paymentChoice === 'online_full' || paymentChoice === 'online_deposit'

    if (willPayOnline) {
      pendingOrderBody.current = body
      setShowPaymentModal(true)
      return
    }

    await submitOrder(body)
  }

  async function submitOrder(body: Record<string, unknown>) {
    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as { orderId?: string; clientToken?: string; redirect?: string; error?: string }

      if (!res.ok || data.error) {
        toast.error(data.error ?? 'Une erreur est survenue.')
        return
      }

      // Commande créée avec succès → effacer le panier sauvegardé
      clearCart()

      if (data.redirect === 'pay' && data.orderId) {
        router.push(`${basePath}/commander/pay?order_id=${data.orderId}&token=${data.clientToken ?? ''}`)
      } else {
        router.push(`${basePath}/commander/success?order_id=${data.orderId}&token=${data.clientToken ?? ''}`)
      }
    } catch {
      toast.error('Erreur réseau. Réessaie.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-300 bg-white'

  const displayFont = { fontFamily: 'var(--lv6-display, "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif)' }

  // ── Relevé (recap) — composant partagé §6 de la spec (lot B), réutilisé tel quel
  // par la barre mobile et la colonne desktop, sans dupliquer son contenu.
  const recapContent = itemsSubtotal > 0 && (
    <OrderSummary
      currency={shopCurrency}
      itemCount={items.length}
      itemsSubtotal={rawSubtotal}
      qtyDiscountAmount={qtyDiscountAmount}
      promoCode={promoStatus === 'valid' ? promoCode.trim().toUpperCase() : null}
      promoDiscountPct={promoDiscount}
      promoAmount={promoAmount}
      promoInputValue={promoCode}
      onPromoInputChange={v => {
        setPromoCode(v)
        if (promoStatus !== 'idle') { setPromoStatus('idle'); setPromoDiscount(0) }
      }}
      promoStatus={promoStatus}
      promoError={promoError}
      onApplyPromo={applyPromoCode}
      onRemovePromo={() => {
        setPromoCode('')
        setPromoDiscount(0)
        setPromoStatus('idle')
        setPromoError('')
      }}
      deliveryAmount={deliveryPrice}
      deliveryZoneName={selectedZone?.name}
      total={total}
      amountNow={amountNow}
      amountLater={amountLater}
      laterContext={hasPhysicalItem ? deliveryType : null}
    />
  )

  const ctaButton = (
    <>
      {!acceptingOrders ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-center text-sm font-semibold text-amber-800">
          Cette boutique ne prend pas de commandes en ce moment.
        </div>
      ) : !hasAnyPaymentMethod ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-center text-sm font-semibold text-amber-800">
          Cette boutique n&apos;accepte aucun mode de paiement en ce moment.
        </div>
      ) : (
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white shadow-xl transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: primaryColor }}
        >
          <ShoppingBag className="h-5 w-5" />
          {submitting ? 'Envoi en cours...' : hasDigitalItem ? 'Acheter et télécharger' : 'Confirmer la commande'}
        </button>
      )}
      <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center text-[10px] text-gray-400 pt-2">
        <span>Paiement traité par Bictorys</span>
        <span className="hidden min-[380px]:inline">·</span>
        <span>Lien de suivi envoyé après la commande</span>
      </p>
    </>
  )

  return (
    <form onSubmit={handleSubmit}>
      {/* Shop header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 bg-white">
        <Link href={`/${shopSlug}`} className="shrink-0 text-gray-400 hover:text-gray-600">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        {shopLogoUrl ? (
          <img src={shopLogoUrl} alt={shopName} className="h-10 w-10 shrink-0 rounded-xl object-cover" />
        ) : (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {shopName[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-900" style={displayFont}>{shopName}</p>
          {shopCity && (
            <p className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-2.5 w-2.5" /> {shopCity}
            </p>
          )}
        </div>
        <p className="ml-auto shrink-0 text-xs font-semibold text-gray-500">Commander</p>
      </div>

      {/* Disposition : une colonne mobile, deux colonnes ≥960px (formulaire + relevé collant) — §5 de la spec */}
      <div className="mx-auto max-w-[1040px] min-[960px]:grid min-[960px]:grid-cols-[1fr_360px] min-[960px]:gap-10 min-[960px]:px-8 min-[960px]:py-8">

        {/* ── Colonne formulaire ── */}
        <div className="space-y-6 px-4 pt-4 pb-44 min-[960px]:px-0 min-[960px]:pb-0">

          {/* 1 — Ce que tu commandes */}
          <section>
            <SectionTitle label="Ce que tu commandes" />
            <div className="space-y-3">
              {items.map((item, i) => {
                const p = getProduct(item.product_id)
                return (
                  <div key={i} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Article {i + 1}
                      </p>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Premier article pré-sélectionné : carte confirmée (pas de dropdown) */}
                    {i === 0 && firstItemLocked && p ? (
                      <div className="flex items-center gap-3">
                        {p.photo ? (
                          <img
                            src={p.photo}
                            alt={p.name}
                            className="h-14 w-14 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                            <Package className="h-5 w-5 text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs font-bold mt-0.5" style={{ color: primaryColor }}>
                            {formatPrice(p.price, shopCurrency)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFirstItemLocked(false)}
                          className="shrink-0 text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600"
                        >
                          Changer
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        {p?.photo ? (
                          <img
                            src={p.photo}
                            alt={p.name}
                            className="h-14 w-14 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                            <Package className="h-5 w-5 text-gray-300" />
                          </div>
                        )}
                        <div className="relative flex-1">
                          <select
                            value={item.product_id}
                            onChange={(e) => updateItem(i, { product_id: e.target.value })}
                            className={`${inputCls} appearance-none py-2.5 pr-10`}
                          >
                            {products.map((prod) => {
                              // Panier non finançable (§8) : sans paiement en ligne accepté par
                              // la boutique, un produit digital n'a structurellement aucun mode
                              // de paiement possible — désactivé à la sélection plutôt que
                              // découvert en bas de formulaire sans issue.
                              const digitalBlocked = prod.product_type === 'digital' && !acceptOnlinePayment
                              return (
                                <option key={prod.id} value={prod.id} disabled={prod.stock_count === 0 || digitalBlocked}>
                                  {prod.name}
                                  {prod.stock_count === 0 ? ' — Rupture' : digitalBlocked ? ' — Paiement en ligne requis' : ''}
                                </option>
                              )
                            })}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>
                    )}
                    {p?.stock_count === 0 && (
                      <p className="text-xs font-semibold text-red-500">Ce produit est en rupture de stock.</p>
                    )}

                    {p?.variants && p.variants.length > 0 && (
                      <div className="relative">
                        <select
                          value={item.variant_label ?? ''}
                          onChange={(e) => updateItem(i, { variant_label: e.target.value || null })}
                          className={`${inputCls} appearance-none pr-10`}
                        >
                          <option value="">— Choisir une variante —</option>
                          {p.variants.map((v, vi) => (
                            <option key={vi} value={v.label}>
                              {v.label} — {formatPrice(v.price, shopCurrency)}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      </div>
                    )}

                    {p?.customization_enabled && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {p.customization_label || 'Personnalisation'} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.customization_note}
                          onChange={(e) => updateItem(i, { customization_note: e.target.value })}
                          placeholder={p.customization_label ? `Ex : votre ${p.customization_label.toLowerCase()}` : 'Votre texte de personnalisation'}
                          maxLength={200}
                          className={inputCls}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">Quantité</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateItem(i, { quantity: Math.max(1, item.quantity - 1) })}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-600 hover:bg-gray-100"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const maxQty = p?.stock_count != null ? Math.min(p.stock_count, 99) : 99
                            updateItem(i, { quantity: Math.min(maxQty, item.quantity + 1) })
                          }}
                          disabled={p?.stock_count != null && item.quantity >= p.stock_count}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Remises sur quantité */}
                    {p?.quantity_discounts && p.quantity_discounts.length > 0 && (() => {
                      const activePct = getQtyDiscountPct(p, item.quantity)
                      const basePrice = getItemBasePrice(p, item.variant_label)
                      const nextTier  = p.quantity_discounts
                        .filter(d => d.min_qty > item.quantity)
                        .sort((a, b) => a.min_qty - b.min_qty)[0]
                      return (
                        <div className="space-y-1">
                          {activePct > 0 ? (
                            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1.5">
                              <span className="text-xs font-bold text-emerald-700">-{activePct}% appliqué</span>
                              <span className="text-[10px] text-emerald-600">
                                ({formatPrice(basePrice, shopCurrency)} → {formatPrice(Math.floor(basePrice * (100 - activePct) / 100), shopCurrency)})
                              </span>
                            </div>
                          ) : nextTier ? (
                            <p className="text-[10px] text-gray-400">
                              Achetez {nextTier.min_qty} pièces ou plus et économisez {nextTier.discount_pct}%
                            </p>
                          ) : null}
                        </div>
                      )
                    })()}
                  </div>
                )
              })}
            </div>

            {items.length < 5 && (
              <button
                type="button"
                onClick={addItem}
                className="mt-3 flex items-center gap-2 text-sm font-semibold"
                style={{ color: primaryColor }}
              >
                <Plus className="h-4 w-4" />
                Ajouter un autre article
              </button>
            )}
          </section>

          <div className="border-t border-gray-100" />

          {/* 2 — Comment tu reçois ta commande — masquée entièrement pour un produit digital (§5.2) */}
          {hasPhysicalItem && (deliveryOptions.home_delivery || deliveryOptions.store_pickup) && (
            <>
              <section>
                <SectionTitle label="Comment tu reçois ta commande" />
                <div className="space-y-2">
                  {deliveryOptions.home_delivery && (
                    <label
                      className="block cursor-pointer"
                      onClick={() => setDeliveryType('home_delivery')}
                    >
                      <RadioCard checked={deliveryType === 'home_delivery'} primaryColor={primaryColor}>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Livraison à domicile</p>
                          <p className="text-xs text-gray-500">Livré chez vous</p>
                        </div>
                      </RadioCard>
                    </label>
                  )}
                  {deliveryOptions.store_pickup && (
                    <label
                      className="block cursor-pointer"
                      onClick={() => setDeliveryType('store_pickup')}
                    >
                      <RadioCard checked={deliveryType === 'store_pickup'} primaryColor={primaryColor}>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Retrait en boutique</p>
                          <p className="text-xs text-gray-500">Récupérez votre commande</p>
                        </div>
                      </RadioCard>
                    </label>
                  )}
                </div>
                {deliveryType === 'home_delivery' && (
                  <div className="mt-3 space-y-2">
                    {deliveryZones.length > 0 && (
                      <div className="space-y-2">
                        {(showAllZones ? deliveryZones : deliveryZones.slice(0, ZONES_VISIBLE)).map((z) => (
                          <label
                            key={z.id}
                            className="block cursor-pointer"
                            onClick={() => setSelectedZoneId(z.id)}
                          >
                            <RadioCard checked={selectedZoneId === z.id} primaryColor={primaryColor}>
                              <div className="flex w-full items-center justify-between">
                                <p className="text-sm font-semibold text-gray-900">{z.name}</p>
                                <p
                                  className="text-sm font-bold shrink-0"
                                  style={{ color: selectedZoneId === z.id ? primaryColor : '#6b7280' }}
                                >
                                  {z.price > 0 ? formatPrice(z.price, shopCurrency) : 'Gratuit'}
                                </p>
                              </div>
                            </RadioCard>
                          </label>
                        ))}
                        {deliveryZones.length > ZONES_VISIBLE && (
                          <button
                            type="button"
                            onClick={() => setShowAllZones(v => !v)}
                            className="mt-1 text-xs font-semibold"
                            style={{ color: primaryColor }}
                          >
                            {showAllZones
                              ? 'Voir moins'
                              : `Voir ${deliveryZones.length - ZONES_VISIBLE} zone${deliveryZones.length - ZONES_VISIBLE > 1 ? 's' : ''} de plus`}
                          </button>
                        )}
                      </div>
                    )}
                    <div data-error-anchor={errors.address ? true : undefined}>
                      <textarea
                        value={address}
                        onChange={(e) => {
                          setAddress(e.target.value)
                          if (errors.address) setErrors(p => ({ ...p, address: undefined }))
                          saveCart({ address: e.target.value })
                        }}
                        rows={2}
                        placeholder="Adresse de livraison * (quartier, rue, repère...)"
                        className={`${inputCls} resize-none ${errors.address ? 'border-red-400 focus:border-red-400' : ''}`}
                      />
                      {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                    </div>
                  </div>
                )}
              </section>
              <div className="border-t border-gray-100" />
            </>
          )}

          {/* 3 — Où on te joint */}
          <section>
            <SectionTitle label="Où on te joint" />
            <div className="space-y-3">
              <div data-error-anchor={errors.firstName ? true : undefined}>
                <input
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value)
                    if (errors.firstName) setErrors(p => ({ ...p, firstName: undefined }))
                    saveCart({ firstName: e.target.value })
                  }}
                  placeholder="Nom complet *"
                  className={`${inputCls} ${errors.firstName ? 'border-red-400 focus:border-red-400' : ''}`}
                />
                {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
              </div>
              <div data-error-anchor={errors.phone ? true : undefined}>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Téléphone *</label>
                <PhoneInput
                  value={phoneNum}
                  onChange={(v) => {
                    setPhoneNum(v)
                    if (errors.phone) setErrors(p => ({ ...p, phone: undefined }))
                    saveCart({ phoneNum: v })
                  }}
                  dialCode={phoneDial}
                  onDialChange={(d) => { setPhoneDial(d); saveCart({ phoneDial: d }) }}
                  placeholder={PHONE_PLACEHOLDERS[phoneDial] ?? '00 00 00 00'}
                  countries={availableCountries}
                />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  id="same-wa"
                  checked={sameWa}
                  onChange={(e) => setSameWa(e.target.checked)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: primaryColor }}
                />
                <span className="text-sm text-gray-700">Même numéro pour WhatsApp</span>
              </label>
              {!sameWa && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">WhatsApp</label>
                  <PhoneInput
                    value={waNum}
                    onChange={setWaNum}
                    dialCode={waDial}
                    onDialChange={setWaDial}
                    placeholder={PHONE_PLACEHOLDERS[waDial] ?? '00 00 00 00'}
                    countries={availableCountries}
                  />
                </div>
              )}
              <div data-error-anchor={errors.email ? true : undefined}>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => {
                    setClientEmail(e.target.value)
                    if (errors.email) setErrors(p => ({ ...p, email: undefined }))
                  }}
                  placeholder={!hasPhysicalItem && hasDigitalItem ? 'E-mail *' : 'E-mail (optionnel)'}
                  autoComplete="email"
                  className={`${inputCls} ${errors.email ? 'border-red-400 focus:border-red-400' : ''}`}
                />
                {errors.email ? (
                  <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-400">
                    {!hasPhysicalItem && hasDigitalItem
                      ? 'Ton lien de téléchargement sera aussi envoyé par e-mail.'
                      : 'Votre adresse e-mail nous permettra de vous envoyer une confirmation de commande.'}
                  </p>
                )}
              </div>
            </div>
          </section>

          <div className="border-t border-gray-100" />

          {/* 4 — Comment tu paies */}
          <section>
            <SectionTitle label="Comment tu paies" />

            {switchedForDigital && hasDigitalItem && (
              <p className="mb-3 rounded-xl bg-violet-50 border border-violet-100 px-3 py-2 text-xs text-violet-700">
                Ta commande contient un fichier à télécharger, elle se règle en ligne.
              </p>
            )}

            {!hasAnyPaymentMethod ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-center text-sm font-semibold text-amber-800">
                Cette boutique n&apos;accepte aucun mode de paiement en ce moment.
              </div>
            ) : paymentChoices.length === 1 ? (
              // Une décision qui n'en est pas une disparaît (§5, principe D) : un seul
              // mode possible devient une phrase, pas un bouton radio pré-coché seul.
              <p className="text-sm font-medium text-gray-700">
                {paymentChoices[0] === 'online_full' && (
                  <>Tu paies <strong>{formatPrice(total, shopCurrency)}</strong> maintenant par mobile money.</>
                )}
                {paymentChoices[0] === 'on_delivery' && (
                  <>Tu régleras <strong>{formatPrice(total, shopCurrency)}</strong> en espèces {deliveryType === 'home_delivery' ? 'à la livraison' : 'en boutique'}.</>
                )}
              </p>
            ) : (
            <div className="space-y-2">
              {paymentChoices.map(choice => (
                <label key={choice} className="block cursor-pointer" onClick={() => setPaymentChoice(choice)}>
                  <RadioCard checked={paymentChoice === choice} primaryColor={primaryColor}>
                    <div>
                      {choice === 'online_full' && (
                        <>
                          <p className="text-sm font-semibold text-gray-900">Payer maintenant</p>
                          <p className="text-xs text-gray-500">Wave, Orange Money, Maxit</p>
                          {paymentChoice === 'online_full' && total > 0 && (
                            <p className="mt-1 text-xs font-bold" style={{ color: primaryColor }}>
                              Total : {formatPrice(total, shopCurrency)}
                            </p>
                          )}
                        </>
                      )}
                      {choice === 'online_deposit' && (
                        <>
                          <p className="text-sm font-semibold text-gray-900">Payer un acompte</p>
                          <p className="text-xs text-gray-500">
                            {allItemsHaveDeposit ? 'Le reste se règle à la livraison' : 'Acompte partiel — le reste se paie à la livraison'}
                          </p>
                          <p className="mt-1 text-xs font-bold" style={{ color: primaryColor }}>
                            Acompte : {formatPrice(depositAmount, shopCurrency)}
                          </p>
                        </>
                      )}
                      {choice === 'on_delivery' && (
                        <>
                          <p className="text-sm font-semibold text-gray-900">
                            {deliveryType === 'home_delivery' ? 'Payer à la livraison' : 'Payer en boutique'}
                          </p>
                          <p className="text-xs text-gray-500">Tu payes à la réception</p>
                        </>
                      )}
                    </div>
                  </RadioCard>
                </label>
              ))}
            </div>
            )}
          </section>

          <div className="border-t border-gray-100" />

          {/* Hors sections : précision optionnelle, dépliée à la demande (§5) */}
          <div>
            <button
              type="button"
              onClick={() => setNotesOpen(v => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              <Pencil className="h-3 w-3" />
              Ajouter une précision
            </button>
            {notesOpen && (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Allergies, instructions particulières..."
                className={`${inputCls} resize-none mt-2`}
                autoFocus
              />
            )}
          </div>

        </div>

        {/* ── Colonne relevé — desktop uniquement (≥960px), collante ── */}
        <div className="hidden min-[960px]:block">
          <div className="sticky top-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-gray-900" style={displayFont}>Ce que tu paies</p>
            {recapContent}
            {ctaButton}
          </div>
        </div>
      </div>

      {/* Barre collante mobile — hauteur réservée par le pb-44 de la colonne formulaire (corrige 3.2).
          max-w-lg mx-auto sur le contenu (pas sur la barre elle-même, qui reste pleine largeur) : sans
          cap explicite, un texte qui ne se coupe pas peut forcer la barre — donc toute la page — plus
          large que le viewport (constaté en recette sur cette refonte, corrigé ici). */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 min-[960px]:hidden overflow-x-hidden bg-white border-t border-gray-100 shadow-[0_-8px_20px_rgba(0,0,0,0.06)]"
      >
        <div
          className="max-w-lg mx-auto space-y-2 px-4 pt-3"
          style={{ paddingBottom: 'calc(1.75rem + env(safe-area-inset-bottom))' }}
        >
          {recapContent && <div className="px-1">{recapContent}</div>}
          {ctaButton}
        </div>
      </div>

      {/* ── Modal engagement paiement mobile money ───────────────────────── */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="w-full max-w-sm mx-4 mb-4 sm:mb-0 bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* En-tête */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-base leading-tight">Confirme ton paiement</p>
                  <p className="text-xs text-gray-500 mt-0.5">Mobile money requis</p>
                </div>
              </div>
            </div>

            {/* Corps */}
            <div className="px-6 py-5">
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                En cliquant sur <strong>Continuer</strong>, tu t&apos;engages à payer{' '}
                <strong className="text-gray-900">
                  {formatPrice(paymentChoice === 'online_deposit' ? depositAmount : total, shopCurrency)}
                </strong>{' '}
                {paymentChoice === 'online_deposit' ? "d'acompte " : ''}par mobile money (Wave, Orange Money, etc.).
              </p>
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
                Si tu n&apos;effectues pas le paiement, la commande sera automatiquement annulée.
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setShowPaymentModal(false)
                  if (pendingOrderBody.current) submitOrder(pendingOrderBody.current)
                }}
                className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting ? 'Envoi...' : 'Continuer →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
