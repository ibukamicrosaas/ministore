'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Shirt, Sparkles, Scissors, ShoppingBag, UtensilsCrossed, BookOpen, Smartphone, Package,
  Store, Rocket, Magnet, Settings, Truck, Wallet, ArrowLeft, ArrowRight, Bell, KeyRound,
  Check, Circle, Camera, Plus, Link2, QrCode,
} from 'lucide-react'
import styles from './start.module.css'
import { PinInput } from '@/components/ui/PinInput'
import { createDraftShop, completeSignupFromStart, joinWaitlist, activateTrialShop } from './actions'
import { createProduct, uploadProductPhoto } from '@/lib/actions/products'
import type { ProductPhoto } from '@/types'
import {
  CAT_LABEL, CAT_EXAMPLE, PREUVES_CAT, CAT_TO_SPECIALTY,
  ETATS, BLOCAGES, REVEAL, PREP, PARTAGE,
  AFRICA_QUIZ_COUNTRIES, DIASPORA_QUIZ_COUNTRIES, getCountryEntry, getCurrencyLabel, getPaymentInfo,
  makeSlug,
  type QuizCat, type QuizEtat, type QuizPays, type QuizBlocage,
} from './data'

type Step = 0 | 1 | 2 | 3 | 4 | 41 | 5 | 6 | 7 | 8 | 9 | 10 | 11

const STORAGE_KEY = 'tekkishop_start_v4'

interface State {
  step:           Step
  nom:            string
  cat:            QuizCat | null
  specialtyOther: string
  etat:           QuizEtat | null
  pays:           QuizPays | null
  diaspora:       boolean
  blocage:        QuizBlocage | null
  waitPays:       string
  waitTel:        string
  waitSubmitted:  boolean
  localNum:       string
  draftShopId:    string | null
  finalSlug:      string | null
  photos:         ProductPhoto[]
  prodNom:        string
  prodPrix:       string
  prodStock:      string
}

const INIT: State = {
  step: 0, nom: '', cat: null, specialtyOther: '', etat: null, pays: null, diaspora: false,
  blocage: null, waitPays: '', waitTel: '', waitSubmitted: false, localNum: '',
  draftShopId: null, finalSlug: null, photos: [], prodNom: '', prodPrix: '', prodStock: '',
}

// Champs persistés en sessionStorage — jamais le PIN (jamais nécessaire à la reprise :
// une fois le compte créé, la session Supabase suffit à continuer le parcours).
function loadPersisted(): Partial<State> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as Partial<State> : null
  } catch {
    return null
  }
}

function savePersisted(state: State) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // sessionStorage indisponible (navigation privée stricte, quota) — pas bloquant
  }
}

// ── Icônes réseaux sociaux (marques réelles, pas de style Lucide générique) ─────
function WaIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}
function IgIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#E1306C" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  )
}

const CAT_ICONS: Record<QuizCat, React.ReactNode> = {
  mode:        <Shirt />,
  beaute:      <Sparkles />,
  cheveux:     <Scissors />,
  chaussures:  <ShoppingBag />,
  alimentaire: <UtensilsCrossed />,
  digital:     <BookOpen />,
  electro:     <Smartphone />,
  autre:       <Package />,
}

const ETAT_ICONS: Record<QuizEtat, React.ReactNode> = {
  wa:     <WaIcon />,
  social: <IgIcon />,
  phys:   <Store />,
  peu:    <Package />,
  debut:  <Rocket />,
}

const BLOCAGE_ICONS: Record<QuizBlocage, React.ReactNode> = {
  clients:  <Magnet />,
  auto:     <Settings />,
  gestion:  <Truck />,
  paiement: <Wallet />,
}

function Proof({ html }: { html: string }) {
  return <div className={styles.proof} dangerouslySetInnerHTML={{ __html: html }} />
}

export function StartFlow({ shopCount }: { shopCount: number }) {
  const [s, setS] = useState<State>(INIT)
  const [hydrated, setHydrated] = useState(false)
  const nomRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [pin, setPin] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [waitError, setWaitError] = useState<string | null>(null)

  // ── Restauration depuis sessionStorage au montage ─────────────────────────
  useEffect(() => {
    const persisted = loadPersisted()
    if (persisted) setS(prev => ({ ...prev, ...persisted }))
    setHydrated(true)
  }, [])

  // ── Persistance à chaque changement d'étape/réponse ───────────────────────
  useEffect(() => {
    if (!hydrated) return
    savePersisted(s)
  }, [s, hydrated])

  const goTo = useCallback((n: Step) => {
    setError(null)
    setS(prev => ({ ...prev, step: n }))
  }, [])

  const back = useCallback(() => {
    if (s.step === 41) { goTo(4); return }
    if (s.step >= 1 && s.step <= 5) goTo((s.step - 1) as Step)
  }, [s.step, goTo])

  useEffect(() => {
    if (s.step === 1) setTimeout(() => nomRef.current?.focus(), 200)
  }, [s.step])

  // ── Dérivés ────────────────────────────────────────────────────────────────
  const etatData      = ETATS.find(e => e.value === s.etat) ?? null
  const seg            = etatData?.seg ?? 'C'
  const canal           = etatData?.canal ?? 'whatsapp'
  const paysEntry       = s.pays ? getCountryEntry(s.pays) : null
  const paymentInfo     = s.pays ? getPaymentInfo(s.pays) : null
  const currencyLabel   = s.pays ? getCurrencyLabel(s.pays) : 'FCFA'
  const slugPreview     = makeSlug(s.nom)
  const blocageData     = BLOCAGES.find(b => b.value === s.blocage) ?? null
  const countryList     = s.diaspora ? DIASPORA_QUIZ_COUNTRIES : AFRICA_QUIZ_COUNTRIES

  const progress = s.step >= 1 && s.step <= 5 ? (s.step / 5) * 100
    : s.step === 41 ? 80
    : s.step >= 6 ? 100 : 0
  const stepLabel = s.step >= 1 && s.step <= 5 ? `Étape ${s.step}/5` : ''
  const backVisible = (s.step >= 1 && s.step <= 5) || s.step === 41

  // ── Écran 7 — construction : anime la liste + crée la boutique en brouillon ──
  const [builtItems, setBuiltItems] = useState<number[]>([])
  useEffect(() => {
    if (s.step !== 7) { setBuiltItems([]); return }

    if (s.cat && s.pays) {
      createDraftShop({
        name: s.nom, category: s.cat, specialtyOther: s.specialtyOther,
        country: s.pays, sellerStage: seg, sellingChannel: canal, painPoint: s.blocage ?? undefined,
      }).then(result => {
        if (result.shopId) setS(prev => ({ ...prev, draftShopId: result.shopId ?? null, finalSlug: result.slug ?? prev.finalSlug }))
      }).catch(() => { /* le parcours de secours à l'écran 9 prend le relais */ })
    }

    const timers = [0, 1, 2, 3].map(i =>
      setTimeout(() => setBuiltItems(prev => [...prev, i]), 500 + i * 620)
    )
    const advance = setTimeout(() => goTo(8), 500 + 4 * 620 + 380)
    return () => { timers.forEach(clearTimeout); clearTimeout(advance) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.step])

  // ── Écran 8 — jauge 0 → 80 % ───────────────────────────────────────────────
  const [gaugeW, setGaugeW]     = useState(0)
  const [gaugePct, setGaugePct] = useState(0)
  useEffect(() => {
    if (s.step !== 8) { setGaugeW(0); setGaugePct(0); return }
    const t = setTimeout(() => {
      setGaugeW(80)
      let n = 0
      const iv = setInterval(() => {
        n += 4; setGaugePct(Math.min(n, 80))
        if (n >= 80) clearInterval(iv)
      }, 38)
    }, 280)
    return () => clearTimeout(t)
  }, [s.step])

  // ── Écran 10 — jauge 80 → 100 % après publication du produit ─────────────
  const [prodGauge, setProdGauge] = useState(80)
  useEffect(() => { if (s.step === 10) setProdGauge(80) }, [s.step])

  // ── Soumission compte (écran 9) ────────────────────────────────────────────
  async function handleAccountSubmit() {
    if (!s.pays || !s.cat) return
    setSubmitting(true)
    setError(null)
    const result = await completeSignupFromStart({
      phone: `${paysEntry?.dial ?? ''}${s.localNum.replace(/\s/g, '')}`,
      pin, name: s.nom,
      category: s.cat, specialtyOther: s.specialtyOther, country: s.pays,
      sellerStage: seg, sellingChannel: canal, painPoint: s.blocage ?? undefined,
      draftShopId: s.draftShopId,
    })
    setSubmitting(false)
    if (result.error) { setError(result.error); return }
    setS(prev => ({ ...prev, finalSlug: result.slug ?? prev.finalSlug }))
    goTo(10)
  }

  // ── Photo produit (écran 10) ───────────────────────────────────────────────
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    const fd = new FormData()
    fd.append('photo', file)
    const result = await uploadProductPhoto(fd)
    setUploadingPhoto(false)
    if (result.url) {
      setS(prev => ({ ...prev, photos: [{ url: result.url!, is_primary: true }] }))
    }
  }

  // ── Soumission produit (écran 10) ──────────────────────────────────────────
  async function handleProductSubmit() {
    if (!s.cat) return
    setSubmitting(true)
    setError(null)
    const result = await createProduct({
      name: s.prodNom.trim(),
      price: Number(s.prodPrix) || 0,
      category: CAT_TO_SPECIALTY[s.cat],
      photos: s.photos,
      stock_count: s.prodStock ? Number(s.prodStock) : null,
    })
    if (result.error) { setSubmitting(false); setError(result.error); return }

    // La boutique ne devient publique qu'une fois qu'elle a un produit à vendre.
    const activation = await activateTrialShop()
    setSubmitting(false)
    if (activation.error) { setError(activation.error); return }

    setProdGauge(100)
    setTimeout(() => goTo(11), 500)
  }

  // ── Liste d'attente (écran 4bis) ───────────────────────────────────────────
  async function handleWaitlistSubmit() {
    setWaitError(null)
    const result = await joinWaitlist({ country: s.waitPays, phone: s.waitTel })
    if (result.error) { setWaitError(result.error); return }
    setS(prev => ({ ...prev, waitSubmitted: true }))
  }

  const nomOk    = s.nom.trim().length >= 2
  const phoneOk  = s.localNum.replace(/\D/g, '').length >= 6
  const waitOk   = s.waitPays.trim().length >= 3 && s.waitTel.replace(/\D/g, '').length >= 8
  const prodOk   = s.photos.length > 0 && s.prodNom.trim().length >= 2 && !!s.prodPrix

  const bodyMid = s.step === 0 || s.step === 6 || s.step === 7

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <button
          className={styles.back}
          style={{ visibility: backVisible ? 'visible' : 'hidden' }}
          onClick={back}
          aria-label="Revenir en arrière"
        >
          <ArrowLeft size={20} />
        </button>
        <span className={styles.logo}>TEKKI<span>Shop</span></span>
        <span className={styles.stepnum}>{stepLabel}</span>
      </div>

      <div className={styles.bar}>
        <div className={styles.barFill} style={{ width: `${progress}%` }} />
      </div>

      <div className={`${styles.body} ${bodyMid ? styles.bodyMid : ''}`}>

        {/* ── 0 · Accueil ─────────────────────────────────────────────────── */}
        {s.step === 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--blp)', color: 'var(--bld)', fontSize: '.8rem', fontWeight: 700, padding: '8px 15px', borderRadius: 99 }}>
                <Circle size={14} /> 60 secondes chrono
              </span>
            </div>
            <h1 className={styles.h1}>Réponds à 5 questions.<br />Ta boutique sera <span className={styles.bl}>prête</span>.</h1>
            <p className={styles.sub} style={{ marginTop: 15 }}>
              Pas de blabla, pas de formulaire compliqué. Tu réponds, on construit ta boutique pendant ce temps. Gratuit.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11, marginTop: 26, fontSize: '.86rem', color: 'var(--gr)' }}>
              <div style={{ display: 'flex' }}>
                {['/avatars/1.jpg', '/avatars/2.jpg', '/avatars/3.jpg'].map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt="" width={30} height={30}
                    style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid #F6F8FC', marginLeft: i ? -8 : 0, objectFit: 'cover' }} />
                ))}
              </div>
              <span><b>+{shopCount.toLocaleString('fr-FR')} marchands</b> ont déjà leur boutique</span>
            </div>
          </>
        )}

        {/* ── 1 · Nom de la boutique ──────────────────────────────────────── */}
        {s.step === 1 && (
          <>
            <h2 className={styles.h2}>Comment s&apos;appelle ta boutique&nbsp;?</h2>
            <p className={styles.sub}>C&apos;est le nom que tes clients verront. Tu pourras le changer plus tard.</p>
            <input
              ref={nomRef}
              className={`${styles.bigfield} ${nomOk ? styles.bigfieldOk : ''}`}
              maxLength={30}
              autoComplete="off"
              placeholder="Ex : Nala Store"
              value={s.nom}
              onChange={e => setS(prev => ({ ...prev, nom: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter' && nomOk) goTo(2) }}
            />
            <div className={styles.hints}>
              {['Nala Store', 'Maison Kora', 'Élite Sneakers'].map(ex => <span key={ex}>{ex}</span>)}
            </div>
            <Proof html={
              nomOk
                ? `L'adresse de ta boutique sera <b>tekki.shop/${slugPreview}</b>.`
                : `Le nom de ta boutique deviendra son adresse : <b>tekki.shop/nom-de-ta-boutique</b>.`
            } />
          </>
        )}

        {/* ── 2 · Catégorie ───────────────────────────────────────────────── */}
        {s.step === 2 && (
          <>
            <h2 className={styles.h2}>Tu vends quoi, <span className={styles.bl}>{s.nom || 'toi'}</span>&nbsp;?</h2>
            <p className={styles.sub}>On adapte ta boutique et tes fiches produit à ce que tu vends.</p>
            <div className={styles.grid2}>
              {(Object.keys(CAT_LABEL) as QuizCat[]).map(c => (
                <button key={c} className={`${styles.tile} ${s.cat === c ? styles.tileOn : ''}`}
                  onClick={() => setS(prev => ({ ...prev, cat: c }))}>
                  <span className={styles.tileIcon}>{CAT_ICONS[c]}</span>
                  <span>{CAT_LABEL[c]}</span>
                </button>
              ))}
            </div>
            {s.cat === 'autre' && (
              <div className={styles.field}>
                <label className={styles.lab} htmlFor="specialtyOther">Tu vends quoi&nbsp;?</label>
                <input
                  id="specialtyOther"
                  placeholder="Ex : Artisanat, bijoux, jouets…"
                  value={s.specialtyOther}
                  onChange={e => setS(prev => ({ ...prev, specialtyOther: e.target.value }))}
                />
              </div>
            )}
            {s.cat && <Proof html={PREUVES_CAT[s.cat]} />}
          </>
        )}

        {/* ── 3 · Où en es-tu ─────────────────────────────────────────────── */}
        {s.step === 3 && (
          <>
            <h2 className={styles.h2}>Où en es-tu aujourd&apos;hui&nbsp;?</h2>
            <p className={styles.sub}>Sois honnête, il n&apos;y a pas de mauvaise réponse. Ça change ce qu&apos;on prépare pour toi.</p>
            <div className={styles.stack}>
              {ETATS.map(e => (
                <button key={e.value} className={`${styles.row} ${s.etat === e.value ? styles.rowOn : ''}`}
                  onClick={() => setS(prev => ({ ...prev, etat: e.value }))}>
                  <span className={styles.rowIcon}>{ETAT_ICONS[e.value]}</span>
                  <span>{e.label}</span>
                </button>
              ))}
            </div>
            {etatData && <Proof html={etatData.proof} />}
          </>
        )}

        {/* ── 4 · Pays ────────────────────────────────────────────────────── */}
        {s.step === 4 && (
          <>
            <h2 className={styles.h2}>Tu es dans quel pays&nbsp;?</h2>
            <p className={styles.sub}>Pour brancher les moyens de paiement de tes clients.</p>
            <div className={styles.grid2}>
              {countryList.map(c => (
                <button key={c.code} className={`${styles.tile} ${s.pays === c.code ? styles.tileOn : ''}`}
                  onClick={() => setS(prev => ({ ...prev, pays: c.code }))}>
                  <span className={styles.flag}>{c.flag}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
            <button className={styles.linkish} style={{ marginTop: 14 }}
              onClick={() => setS(prev => ({ ...prev, diaspora: !prev.diaspora, pays: null }))}>
              {s.diaspora ? '← Revenir aux pays d’Afrique' : 'Je suis en Europe ou au Canada'}
            </button>
            {s.pays && paymentInfo && (
              <Proof html={`Dès le premier jour, tes clients paient par <b>${paymentInfo.text}</b>, déjà intégré, rien à configurer. Et tu <b>retires ton argent instantanément</b>.`} />
            )}
            <div className={styles.spacer} style={{ paddingTop: 16 }}>
              <button className={styles.linkish} style={{ color: 'var(--bld)', fontWeight: 600 }} onClick={() => goTo(41)}>
                Je ne vois pas mon pays
              </button>
            </div>
          </>
        )}

        {/* ── 4 bis · Pays non couvert ──────────────────────────────────────── */}
        {s.step === 41 && (
          <>
            <h2 className={styles.h2}>TekkiShop n&apos;est pas encore chez toi.</h2>
            <p className={styles.sub}>On ouvre les pays un par un. Dis-nous où tu es : c&apos;est ce qui nous dit lequel ouvrir ensuite.</p>

            <div className={styles.altbox}>
              <h4>Préviens-moi quand vous ouvrez</h4>
              <p>On t&apos;écrit sur WhatsApp le jour où ta boutique devient possible chez toi. Rien d&apos;autre.</p>
              {s.waitSubmitted ? (
                <button className={`${styles.btn} ${styles.btnBl} ${styles.off}`}><Check size={19} /> On te préviendra</button>
              ) : (
                <>
                  <div className={styles.field} style={{ marginTop: 0 }}>
                    <label className={styles.lab} htmlFor="wp">Ton pays</label>
                    <input id="wp" placeholder="Ex : Cameroun" value={s.waitPays}
                      onChange={e => setS(prev => ({ ...prev, waitPays: e.target.value }))} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.lab} htmlFor="wt">Ton numéro WhatsApp</label>
                    <input id="wt" type="tel" inputMode="tel" placeholder="+237 6 00 00 00 00" value={s.waitTel}
                      onChange={e => setS(prev => ({ ...prev, waitTel: e.target.value }))} />
                  </div>
                  {waitError && <div className={styles.errorBox}>{waitError}</div>}
                  <button className={`${styles.btn} ${styles.btnBl} ${!waitOk ? styles.off : ''}`}
                    style={{ marginTop: 14 }} disabled={!waitOk} onClick={() => void handleWaitlistSubmit()}>
                    <Bell size={19} /> Me prévenir
                  </button>
                </>
              )}
            </div>

            <div className={styles.sep}>ou</div>

            <div className={`${styles.altbox} ${styles.altboxLicence}`}>
              <h4>Tu veux lancer TekkiShop dans ton pays&nbsp;?</h4>
              <p>Une licence d&apos;exploitation nationale permet à un entrepreneur d&apos;ouvrir et de gérer TekkiShop sur son territoire, en exclusivité.</p>
              <Link href="/licence" className={`${styles.btn} ${styles.btnGh}`}>
                Découvrir la licence <ArrowRight size={19} />
              </Link>
            </div>
          </>
        )}

        {/* ── 5 · Blocage ─────────────────────────────────────────────────── */}
        {s.step === 5 && (
          <>
            <h2 className={styles.h2}>Qu&apos;est-ce qui te bloque le plus&nbsp;?</h2>
            <p className={styles.sub}>On configure ta boutique pour t&apos;aider là-dessus en priorité.</p>
            <div className={styles.stack}>
              {BLOCAGES.map(b => (
                <button key={b.value} className={`${styles.row} ${s.blocage === b.value ? styles.rowOn : ''}`}
                  onClick={() => setS(prev => ({ ...prev, blocage: b.value }))}>
                  <span className={styles.rowIcon}>{BLOCAGE_ICONS[b.value]}</span>
                  <span><span className={styles.rowTitle}>{b.label}</span><span className={styles.rowSub}>{b.sous}</span></span>
                </button>
              ))}
            </div>
            {blocageData && <Proof html={blocageData.proof} />}
          </>
        )}

        {/* ── 6 · Révélation ──────────────────────────────────────────────── */}
        {s.step === 6 && (
          <>
            <div className={styles.kick}>Ce que ça change pour toi</div>
            {seg === 'A' && <h1 className={styles.h1}>Le plus dur est déjà fait, <span className={styles.bl}>{s.nom}</span>.</h1>}
            {seg === 'B' && <h1 className={styles.h1}>Tu as les produits. On s&apos;occupe des <span className={styles.bl}>clients</span>.</h1>}
            {seg === 'C' && <h1 className={styles.h1}>On va y aller <span className={styles.bl}>étape par étape</span>.</h1>}
            <p className={styles.sub} style={{ marginTop: 15 }} dangerouslySetInnerHTML={{ __html: REVEAL[seg].texte }} />
            <div className={styles.note}>
              <b>Ce qu&apos;on prépare pour toi :</b>
              <ul className={styles.prep}>
                {(PREP[s.blocage ?? 'clients']).map(p => (
                  <li key={p}><Check size={18} /><span>{p}</span></li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* ── 7 · Construction ────────────────────────────────────────────── */}
        {s.step === 7 && (
          <>
            <div className={styles.spin} />
            <h2 className={styles.h2} style={{ marginTop: 22 }}>On construit <span className={styles.bl}>{s.nom}</span>…</h2>
            <ul className={styles.buildlist}>
              {[
                'Ta page boutique au format mobile',
                paymentInfo ? `Tes moyens de paiement (${paymentInfo.text})` : 'Tes moyens de paiement',
                'Le paiement à la livraison et le suivi livreur',
                'Ton Assistant IA personnel',
              ].map((item, i) => (
                <li key={item} className={`${styles.buildItem} ${builtItems.includes(i) ? styles.buildItemDone : ''}`}>
                  {builtItems.includes(i) ? <Check size={18} /> : <Circle size={18} />}
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* ── 8 · Carte boutique ──────────────────────────────────────────── */}
        {s.step === 8 && (
          <>
            <h2 className={styles.h2}><span className={styles.bl}>{s.nom}</span> est presque prête&nbsp;!</h2>
            <p className={styles.sub}>Il reste une chose à faire avant de pouvoir vendre.</p>
            <div className={styles.shopcard}>
              <div className={styles.ico}>{s.cat && CAT_ICONS[s.cat]}</div>
              <h3>{s.nom}</h3>
              <div className={styles.url}>tekki.shop/{s.finalSlug ?? slugPreview}</div>
              <div className={styles.badges}>
                {[...(paymentInfo?.labels ?? []), 'À la livraison', 'Suivi livreur', 'Assistant IA'].map(b => (
                  <span key={b}>{b}</span>
                ))}
              </div>
              <div>
                <div className={styles.gaugeLab}>Boutique prête à {gaugePct}%</div>
                <div className={styles.gauge}><div className={styles.gaugeFill} style={{ width: `${gaugeW}%` }} /></div>
              </div>
              <div className={styles.missing}>
                <Package size={19} />
                <div>Il manque <b>ton premier produit</b>. Sans lui, ta boutique est vide et tu ne peux rien vendre. On s&apos;en occupe juste après.</div>
              </div>
            </div>
          </>
        )}

        {/* ── 9 · Compte ──────────────────────────────────────────────────── */}
        {s.step === 9 && (
          <>
            <h2 className={styles.h2}>Crée ton compte</h2>
            <p className={styles.sub}>
              C&apos;est ce qui protège <b style={{ color: 'var(--nt)' }}>{s.nom}</b>, ton argent et tes commandes. Toi seul y accèdes, depuis n&apos;importe quel téléphone.
            </p>
            <label className={styles.lab} htmlFor="tel">Ton numéro WhatsApp</label>
            <div className={styles.phonerow}>
              <div className={styles.dial}><span>{paysEntry?.flag}</span> {paysEntry?.dial}</div>
              <input id="tel" type="tel" inputMode="tel" placeholder={paysEntry?.placeholder}
                value={s.localNum} onChange={e => setS(prev => ({ ...prev, localNum: e.target.value }))} />
            </div>
            <div style={{ marginTop: 20 }}>
              <label className={styles.lab}>Choisis un code PIN à 6 chiffres</label>
              <p className={styles.sub} style={{ marginBottom: 11 }}>Il protège l&apos;accès à tes ventes et à ton argent. Mémorise-le.</p>
              <PinInput name="pin" onChange={setPin} />
            </div>
            {error && <div className={styles.errorBox}>{error}</div>}
            <div className={styles.reassure}>
              <span><Check size={14} /> +{shopCount.toLocaleString('fr-FR')} boutiques créées</span>
              <span><Check size={14} /> Création gratuite</span>
              <span><Check size={14} /> Aucun engagement</span>
            </div>
          </>
        )}

        {/* ── 10 · Premier produit ──────────────────────────────────────────── */}
        {s.step === 10 && (
          <>
            <h2 className={styles.h2}>Ton premier produit</h2>
            <p className={styles.sub}>Une photo, un nom, un prix. C&apos;est tout — tu pourras en ajouter d&apos;autres après.</p>
            <input ref={photoInputRef} type="file" accept="image/*" capture="environment" hidden onChange={e => void handlePhotoChange(e)} />
            {s.photos.length > 0 ? (
              <div className={styles.thumbs}>
                <i style={{ backgroundImage: `url(${s.photos[0].url})` }} />
                <i className={styles.thumbAdd} onClick={() => photoInputRef.current?.click()}><Plus size={18} /></i>
              </div>
            ) : (
              <button className={styles.photo} onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}>
                <Camera size={26} />
                <span>{uploadingPhoto ? 'Envoi en cours…' : 'Ajouter une photo'}</span>
                <small>Prends-la maintenant avec ton téléphone</small>
              </button>
            )}
            <div className={styles.field}>
              <label className={styles.lab} htmlFor="pnom">Nom du produit</label>
              <input id="pnom" placeholder={`Ex : ${s.cat ? CAT_EXAMPLE[s.cat] : 'Mon premier produit'}`}
                value={s.prodNom} onChange={e => setS(prev => ({ ...prev, prodNom: e.target.value }))} />
            </div>
            <div className={`${styles.field} ${styles.duo}`}>
              <div>
                <label className={styles.lab} htmlFor="pprix">Prix</label>
                <div className={styles.suffix}>
                  <input id="pprix" inputMode="numeric" placeholder="14 000" value={s.prodPrix}
                    onChange={e => setS(prev => ({ ...prev, prodPrix: e.target.value.replace(/\D/g, '') }))} />
                  <span>{currencyLabel}</span>
                </div>
              </div>
              <div>
                <label className={styles.lab} htmlFor="pstock">Stock</label>
                <input id="pstock" inputMode="numeric" placeholder="12" value={s.prodStock}
                  onChange={e => setS(prev => ({ ...prev, prodStock: e.target.value.replace(/\D/g, '') }))} />
              </div>
            </div>
            {error && <div className={styles.errorBox}>{error}</div>}
            <Proof html={
              s.cat === 'digital'
                ? "Pour un produit à télécharger, ton client reçoit le fichier <b>automatiquement</b> après avoir payé."
                : "Le stock s'affiche sur ta boutique. Quand il reste peu d'articles, tes clients commandent plus vite."
            } />
            <div style={{ marginTop: 16 }}>
              <div className={styles.gauge}><div className={styles.gaugeFill} style={{ width: `${prodGauge}%`, transition: 'width .6s ease' }} /></div>
            </div>
          </>
        )}

        {/* ── 11 · En ligne ─────────────────────────────────────────────────── */}
        {s.step === 11 && (
          <>
            <h2 className={styles.h2}>Ta boutique est <span className={styles.bl}>en ligne</span>.</h2>
            <p className={styles.sub}>Elle est publique dès maintenant. Tes clients peuvent commander et payer.</p>
            <div className={styles.livecard}>
              <div className={styles.livebar}>
                <i /><i /><i />
                <div className={styles.u}>tekki.shop/{s.finalSlug ?? slugPreview}</div>
              </div>
              <div className={styles.livebody}>
                <div className={styles.livehead}>
                  <div className={styles.av}>{s.cat && CAT_ICONS[s.cat]}</div>
                  <div><b>{s.nom}</b><small>tekki.shop/{s.finalSlug ?? slugPreview}</small></div>
                </div>
                <div className={styles.liveprod}>
                  <i style={{ backgroundImage: s.photos[0] ? `url(${s.photos[0].url})` : undefined, background: s.photos[0] ? undefined : 'var(--blp)' }} />
                  <div><b>{s.prodNom || (s.cat ? CAT_EXAMPLE[s.cat] : '')}</b>
                    <span>{Number(s.prodPrix || 0).toLocaleString('fr-FR')} {currencyLabel}</span></div>
                  <span className={styles.voir}>Voir</span>
                </div>
              </div>
            </div>
            <button className={`${styles.sharebtn} ${styles.sharebtnMain}`}>
              {canal === 'whatsapp' ? <WaIcon /> : canal === 'social' ? <IgIcon /> : <QrCode size={22} />}
              <div><b>{PARTAGE[canal].titre}</b><small>{PARTAGE[canal].sous}</small></div>
            </button>
            <button className={styles.sharebtn}>
              <Link2 size={22} />
              <div><b>Copier mon lien</b><small>tekki.shop/{s.finalSlug ?? slugPreview}</small></div>
            </button>
            <div className={styles.freebox}>
              <b>Tes 3 premières commandes sont offertes.</b> Ensuite, tu choisis un plan pour continuer à recevoir des commandes. Tu ne paies donc qu&apos;après avoir vendu.
            </div>
          </>
        )}

      </div>

      <div className={styles.foot}>
        {s.step === 0 && (
          <>
            <button className={`${styles.btn} ${styles.btnBl}`} onClick={() => goTo(1)}>C&apos;est parti <ArrowRight size={19} /></button>
            <Link href="/login" className={styles.linkish}>J&apos;ai déjà un compte TekkiShop</Link>
          </>
        )}
        {s.step === 1 && (
          <button className={`${styles.btn} ${styles.btnBl} ${!nomOk ? styles.off : ''}`} disabled={!nomOk} onClick={() => goTo(2)}>Continuer</button>
        )}
        {s.step === 2 && (
          <button className={`${styles.btn} ${styles.btnBl} ${!s.cat ? styles.off : ''}`} disabled={!s.cat} onClick={() => goTo(3)}>Continuer</button>
        )}
        {s.step === 3 && (
          <button className={`${styles.btn} ${styles.btnBl} ${!s.etat ? styles.off : ''}`} disabled={!s.etat} onClick={() => goTo(4)}>Continuer</button>
        )}
        {s.step === 4 && (
          <button className={`${styles.btn} ${styles.btnBl} ${!s.pays ? styles.off : ''}`} disabled={!s.pays} onClick={() => goTo(5)}>Continuer</button>
        )}
        {s.step === 41 && (
          <button className={styles.linkish} onClick={() => goTo(4)}>← Revenir au choix du pays</button>
        )}
        {s.step === 5 && (
          <button className={`${styles.btn} ${styles.btnBl} ${!s.blocage ? styles.off : ''}`} disabled={!s.blocage} onClick={() => goTo(6)}>
            Créer ma boutique <ArrowRight size={19} />
          </button>
        )}
        {s.step === 6 && (
          <button className={`${styles.btn} ${styles.btnBl}`} onClick={() => goTo(7)}>On y va <ArrowRight size={19} /></button>
        )}
        {s.step === 8 && (
          <button className={`${styles.btn} ${styles.btnBl}`} onClick={() => goTo(9)}><KeyRound size={19} /> Créer mon compte</button>
        )}
        {s.step === 9 && (
          <>
            <button
              className={`${styles.btn} ${styles.btnVt} ${(!phoneOk || pin.length < 6 || submitting) ? styles.off : ''}`}
              disabled={!phoneOk || pin.length < 6 || submitting}
              onClick={() => void handleAccountSubmit()}
            >
              {submitting ? 'Création en cours…' : 'Ouvrir ma boutique'}
            </button>
            <Link href="/login" className={styles.linkish}>J&apos;ai déjà un compte</Link>
          </>
        )}
        {s.step === 10 && (
          <button
            className={`${styles.btn} ${styles.btnBl} ${(!prodOk || submitting) ? styles.off : ''}`}
            disabled={!prodOk || submitting}
            onClick={() => void handleProductSubmit()}
          >
            {submitting ? 'Publication…' : 'Publier et mettre ma boutique en ligne'}
          </button>
        )}
        {s.step === 11 && (
          <Link href="/dashboard" className={`${styles.btn} ${styles.btnBl}`}>
            Aller à mon tableau de bord <ArrowRight size={19} />
          </Link>
        )}
      </div>
    </div>
  )
}
