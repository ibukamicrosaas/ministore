'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Shirt, Sparkles, ShoppingBag, UtensilsCrossed,
  BookOpen, Smartphone, Home, Package, Store, Rocket,
} from 'lucide-react'
import { PinInput } from '@/components/ui/PinInput'
import { signUpFromStart } from './actions'
import {
  CAT_EMO, CAT_LABEL, PREUVES_CAT, PREUVES_CANAL, PAYS_DATA,
  PREUVES_DOULEUR, makeSlug,
  type QuizCat, type QuizCanal, type QuizPays, type QuizDouleur,
} from './data'

// ── Palette ────────────────────────────────────────────────────────────────────
const BL  = '#2E90FA'
const BLD = '#175CD3'
const BLP = '#EFF6FF'
const VT  = '#12B76A'
const VTP = '#ECFDF3'
const GR  = '#5D6B82'
const LN  = '#E4EAF2'
const NT  = '#0B1B32'

// ── État global ────────────────────────────────────────────────────────────────
interface State {
  step:       number
  nom:        string
  cat:        QuizCat    | null
  canal:      QuizCanal  | null
  pays:       QuizPays   | null
  douleur:    QuizDouleur | null
  localNum:   string
  pin:        string
  submitting: boolean
  error:      string | null
}

const INIT: State = {
  step: 0, nom: '', cat: null, canal: null, pays: null, douleur: null,
  localNum: '', pin: '', submitting: false, error: null,
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const baseBtn: React.CSSProperties = {
  width: '100%', border: 'none', borderRadius: 16, padding: '18px',
  cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800, fontSize: '1.05rem',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  transition: 'opacity .15s', outline: 'none',
}
const blueBtn:  React.CSSProperties = { ...baseBtn, background: BL,  color: '#fff', boxShadow: `0 10px 26px ${BL}55` }
const greenBtn: React.CSSProperties = { ...baseBtn, background: VT,  color: '#fff', boxShadow: `0 10px 26px ${VT}55` }
const disabledStyle: React.CSSProperties = { opacity: .4, pointerEvents: 'none' }

// Styles calculés par sélection — évite tout bug de merge CSS shorthand
const tileStyle = (selected: boolean): React.CSSProperties => ({
  borderWidth: 2, borderStyle: 'solid', borderColor: selected ? BL : LN,
  borderRadius: 16, background: selected ? BLP : '#fff',
  padding: '12px 8px',
  fontFamily: 'inherit', fontSize: '.85rem', fontWeight: 600, color: NT,
  cursor: 'pointer', textAlign: 'center',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
  outline: 'none',
  transition: 'border-color .15s, background .15s',
})

const tileRowStyle = (selected: boolean): React.CSSProperties => ({
  ...tileStyle(selected),
  flexDirection: 'row', justifyContent: 'flex-start',
  textAlign: 'left', padding: '16px 18px',
})

// ── Micro-preuve ───────────────────────────────────────────────────────────────
function Preuve({ html }: { html: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: VTP, border: `1px solid #B9F0D3`, borderRadius: 16, padding: 16, marginTop: 20 }}>
      <p style={{ fontSize: '.9rem', lineHeight: 1.5, color: NT }} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

// ── Icône WhatsApp ─────────────────────────────────────────────────────────────
function WaIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

// ── Icône Instagram ────────────────────────────────────────────────────────────
function IgIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#E1306C" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  )
}

// ── Mapping catégorie → icône ──────────────────────────────────────────────────
const CAT_ICONS: Record<QuizCat, React.ReactNode> = {
  mode:         <Shirt     style={{ width: 22, height: 22 }} />,
  beaute:       <Sparkles  style={{ width: 22, height: 22 }} />,
  chaussures:   <ShoppingBag style={{ width: 22, height: 22 }} />,
  alimentaire:  <UtensilsCrossed style={{ width: 22, height: 22 }} />,
  digital:      <BookOpen  style={{ width: 22, height: 22 }} />,
  electronique: <Smartphone style={{ width: 22, height: 22 }} />,
  maison:       <Home      style={{ width: 22, height: 22 }} />,
  autre:        <Package   style={{ width: 22, height: 22 }} />,
}

// ── Composant principal ────────────────────────────────────────────────────────
export function StartFlow({ shopCount }: { shopCount: number }) {
  const [s, setS] = useState<State>(INIT)
  const nomRef    = useRef<HTMLInputElement>(null)

  const goTo = (n: number) => setS(prev => ({ ...prev, step: n, error: null }))

  const progress = s.step >= 1 && s.step <= 5 ? (s.step / 5) * 100
    : s.step >= 6 ? 100 : 0
  const stepLabel = s.step >= 1 && s.step <= 5 ? `Étape ${s.step}/5` : ''

  useEffect(() => {
    if (s.step === 1) setTimeout(() => nomRef.current?.focus(), 200)
  }, [s.step])

  // ── Construction animation ─────────────────────────────────────────────────
  const [builtItems, setBuiltItems] = useState<number[]>([])
  useEffect(() => {
    if (s.step !== 6) { setBuiltItems([]); return }
    const timers = [0, 1, 2, 3].map(i =>
      setTimeout(() => setBuiltItems(prev => [...prev, i]), 600 + i * 700)
    )
    const advance = setTimeout(() => goTo(7), 600 + 4 * 700 + 400)
    return () => { timers.forEach(clearTimeout); clearTimeout(advance) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.step])

  // ── Gauge animation ────────────────────────────────────────────────────────
  const [gaugeW, setGaugeW]     = useState(0)
  const [gaugePct, setGaugePct] = useState(0)
  useEffect(() => {
    if (s.step !== 7) { setGaugeW(0); setGaugePct(0); return }
    const t = setTimeout(() => {
      setGaugeW(80)
      let n = 0
      const iv = setInterval(() => {
        n += 4; setGaugePct(Math.min(n, 80))
        if (n >= 80) clearInterval(iv)
      }, 40)
      return () => clearInterval(iv)
    }, 300)
    return () => clearTimeout(t)
  }, [s.step])

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!s.pays) return
    const paysData  = PAYS_DATA[s.pays]
    const fullPhone = `${paysData.dialCode}${s.localNum.replace(/\s/g, '')}`
    setS(prev => ({ ...prev, submitting: true, error: null }))
    try {
      const result = await signUpFromStart({
        phone: fullPhone, pin: s.pin, name: s.nom,
        country: paysData.shopCountry, category: s.cat ?? 'autre', painPoint: s.douleur ?? 'clients',
      })
      if (result?.error) setS(prev => ({ ...prev, submitting: false, error: result.error ?? null }))
    } catch {
      // redirect() levée par Next.js sur succès
    }
  }

  const paysData   = s.pays ? PAYS_DATA[s.pays] : null
  const previewSlug = makeSlug(s.nom) || 'ma-boutique'

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="landing-scope"
      style={{ width: '100%', maxWidth: 480, minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 0 60px rgba(11,27,50,.08)' }}
    >
      {/* Barre haute */}
      <div style={{ padding: '14px 20px 10px', display: 'flex', alignItems: 'center', gap: 12 }}>
        {s.step >= 2 && s.step <= 5 && (
          <button onClick={() => goTo(s.step - 1)}
            style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: GR, cursor: 'pointer', width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', outline: 'none' }}
            aria-label="Revenir en arrière">←</button>
        )}
        <span style={{ fontFamily: 'var(--font-landing-display, var(--font-display))', fontWeight: 700, fontSize: '1.05rem', color: NT }}>
          TEKKI<span style={{ color: BL }}>Shop</span>
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '.78rem', fontWeight: 700, color: GR }}>{stepLabel}</span>
      </div>

      {/* Barre de progression */}
      <div style={{ height: 5, background: LN, margin: '0 20px', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg,${BL},${BLD})`, borderRadius: 99, transition: 'width .4s ease' }} />
      </div>

      {/* ── Écran 0 — Accueil ─────────────────────────────────────────── */}
      {s.step === 0 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', padding: '26px 22px 30px', gap: 0 }}>
          <span style={{ display: 'inline-flex', alignSelf: 'center', alignItems: 'center', gap: 8, background: BLP, color: BLD, fontSize: '.82rem', fontWeight: 700, padding: '8px 16px', borderRadius: 99, marginBottom: 22 }}>
            ⚡ 60 secondes chrono
          </span>
          <h1 style={{ fontFamily: 'var(--font-landing-display, var(--font-display))', fontSize: 'clamp(1.9rem,8vw,2.5rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 0 }}>
            Réponds à 5 questions.<br />Ta boutique sera <span style={{ color: BL }}>prête</span>.
          </h1>
          <p style={{ color: GR, margin: '16px 0 30px', fontSize: '1.02rem' }}>
            Pas de blabla, pas de formulaire compliqué. Tu réponds, on construit ta boutique en ligne pendant ce temps. Gratuit.
          </p>
          <button style={blueBtn} onClick={() => goTo(1)}>C&apos;est parti 🚀</button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 22, fontSize: '.85rem', color: GR }}>
            {/* Vrais avatars */}
            <div style={{ display: 'flex' }}>
              {['/avatars/1.jpg', '/avatars/2.jpg', '/avatars/3.jpg'].map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="" width={30} height={30}
                  style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid #fff', marginLeft: i === 0 ? 0 : -8, objectFit: 'cover' }} />
              ))}
              <div style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid #fff', marginLeft: -8, background: BLP, display: 'grid', placeItems: 'center', fontSize: '.65rem', fontWeight: 700, color: BLD }}>
                +
              </div>
            </div>
            <span><b>+{shopCount.toLocaleString('fr-FR')} marchands</b> ont déjà leur boutique</span>
          </div>
          <Link href="/login" style={{ display: 'block', textAlign: 'center', marginTop: 14, fontSize: '.85rem', color: GR, textDecoration: 'underline' }}>
            J&apos;ai déjà un compte TEKKIShop
          </Link>
        </div>
      )}

      {/* ── Écran 1 — Nom ─────────────────────────────────────────────── */}
      {s.step === 1 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '26px 22px 30px' }}>
          <h2 style={{ fontFamily: 'var(--font-landing-display, var(--font-display))', fontSize: 'clamp(1.5rem,6vw,1.9rem)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 8 }}>
            Comment s&apos;appelle ton business&nbsp;?
          </h2>
          <p style={{ color: GR, fontSize: '.95rem', marginBottom: 24 }}>
            C&apos;est le nom que tes clients verront. Tu pourras le changer plus tard.
          </p>
          <input
            ref={nomRef}
            type="text" maxLength={30} autoComplete="off"
            placeholder="Ex : Chez Fatou"
            value={s.nom}
            onChange={e => setS(prev => ({ ...prev, nom: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter' && s.nom.trim().length >= 2) goTo(2) }}
            style={{ width: '100%', borderWidth: 2, borderStyle: 'solid', borderColor: s.nom.trim().length >= 2 ? BL : LN, borderRadius: 16, padding: 18, fontFamily: 'var(--font-landing-display, var(--font-display))', fontSize: '1.25rem', fontWeight: 600, textAlign: 'center', color: NT, outline: 'none', transition: 'border-color .15s' }}
          />
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Chez Fatou', 'Adja Cosmétiques', 'Dakar Sneakers'].map(ex => (
              <button key={ex} onClick={() => setS(prev => ({ ...prev, nom: ex }))}
                style={{ border: `1px solid ${LN}`, background: '#fff', borderRadius: 99, padding: '7px 14px', fontFamily: 'inherit', fontSize: '.82rem', color: GR, cursor: 'pointer', outline: 'none' }}>
                {ex}
              </button>
            ))}
          </div>
          <Preuve html={
            s.nom.trim().length >= 2
              ? `L'URL de ta boutique sera : <b>tekki.shop/${makeSlug(s.nom)}</b>. Choisis un nom court et mémorable que tes clients retiendront facilement.`
              : `Ton nom apparaîtra dans l'URL de ta boutique : <b>tekki.shop/ton-nom</b>. Choisis quelque chose de court et facile à mémoriser.`
          } />
          <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            <button
              style={{ ...blueBtn, ...(s.nom.trim().length < 2 ? disabledStyle : {}) }}
              disabled={s.nom.trim().length < 2}
              onClick={() => goTo(2)}
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* ── Écran 2 — Catégorie ───────────────────────────────────────── */}
      {s.step === 2 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '26px 22px 30px' }}>
          <h2 style={{ fontFamily: 'var(--font-landing-display, var(--font-display))', fontSize: 'clamp(1.5rem,6vw,1.9rem)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 8 }}>
            Tu vends quoi, <span style={{ color: BL }}>{s.nom || 'toi'}</span>&nbsp;?
          </h2>
          <p style={{ color: GR, fontSize: '.95rem', marginBottom: 16 }}>Choisis le domaine d&apos;activité de ton business.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {(['mode', 'beaute', 'chaussures', 'alimentaire', 'digital', 'electronique', 'maison', 'autre'] as QuizCat[]).map(c => (
              <button key={c} style={tileStyle(s.cat === c)}
                onClick={() => setS(prev => ({ ...prev, cat: c }))}>
                <span style={{ color: s.cat === c ? BL : GR }}>{CAT_ICONS[c]}</span>
                <span style={{ fontSize: '.82rem' }}>{CAT_LABEL[c]}</span>
              </button>
            ))}
          </div>
          {s.cat && <Preuve html={PREUVES_CAT[s.cat]} />}
          <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            <button style={{ ...blueBtn, ...(!s.cat ? disabledStyle : {}) }} disabled={!s.cat} onClick={() => goTo(3)}>
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* ── Écran 3 — Canal actuel ────────────────────────────────────── */}
      {s.step === 3 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '26px 22px 30px' }}>
          <h2 style={{ fontFamily: 'var(--font-landing-display, var(--font-display))', fontSize: 'clamp(1.5rem,6vw,1.9rem)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 8 }}>
            Aujourd&apos;hui, tu vends où&nbsp;?
          </h2>
          <p style={{ color: GR, fontSize: '.95rem', marginBottom: 24 }}>Sois honnête, il n&apos;y a pas de mauvaise réponse.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {([
              { v: 'whatsapp' as QuizCanal, label: 'Sur WhatsApp (statuts, groupes)',      icon: <WaIcon /> },
              { v: 'instagram' as QuizCanal, label: 'Sur Instagram ou TikTok',             icon: <IgIcon /> },
              { v: 'physique' as QuizCanal,  label: 'Au marché ou en boutique physique',   icon: <Store  style={{ width: 20, height: 20, color: '#6366F1' }} /> },
              { v: 'debut' as QuizCanal,     label: 'Je démarre, je ne vends pas encore',  icon: <Rocket style={{ width: 20, height: 20, color: '#F59E0B' }} /> },
            ]).map(({ v, label, icon }) => (
              <button key={v} style={tileRowStyle(s.canal === v)}
                onClick={() => setS(prev => ({ ...prev, canal: v }))}>
                <span style={{ flexShrink: 0, width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
          {s.canal && <Preuve html={PREUVES_CANAL[s.canal]} />}
          <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            <button style={{ ...blueBtn, ...(!s.canal ? disabledStyle : {}) }} disabled={!s.canal} onClick={() => goTo(4)}>
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* ── Écran 4 — Pays ───────────────────────────────────────────── */}
      {s.step === 4 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '26px 22px 30px' }}>
          <h2 style={{ fontFamily: 'var(--font-landing-display, var(--font-display))', fontSize: 'clamp(1.5rem,6vw,1.9rem)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 8 }}>
            Tu es dans quel pays&nbsp;?
          </h2>
          <p style={{ color: GR, fontSize: '.95rem', marginBottom: 24 }}>Pour préparer les moyens de paiement de tes clients.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {(Object.keys(PAYS_DATA) as QuizPays[]).map(p => (
              <button key={p} style={tileStyle(s.pays === p)}
                onClick={() => setS(prev => ({ ...prev, pays: p }))}>
                <span style={{ fontSize: '1.9rem' }}>{PAYS_DATA[p].flag}</span>
                <span style={{ fontSize: '.85rem' }}>{PAYS_DATA[p].name}</span>
              </button>
            ))}
          </div>
          {s.pays && (
            <Preuve html={`Dès le 1er jour, tes clients peuvent payer par <b>${PAYS_DATA[s.pays].paieText}</b>, déjà intégrés dans ta boutique, rien à configurer. Et tu <b>retires ton argent instantanément</b>.`} />
          )}
          <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            <button style={{ ...blueBtn, ...(!s.pays ? disabledStyle : {}) }} disabled={!s.pays} onClick={() => goTo(5)}>
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* ── Écran 5 — Casse-tête ─────────────────────────────────────── */}
      {s.step === 5 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '26px 22px 30px' }}>
          <h2 style={{ fontFamily: 'var(--font-landing-display, var(--font-display))', fontSize: 'clamp(1.5rem,6vw,1.9rem)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 8 }}>
            Ton plus grand casse-tête, c&apos;est quoi&nbsp;?
          </h2>
          <p style={{ color: GR, fontSize: '.95rem', marginBottom: 24 }}>On configure ta boutique pour t&apos;aider là-dessus en priorité.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {([
              { v: 'clients'   as QuizDouleur, label: 'Trouver des clients' },
              { v: 'livraison' as QuizDouleur, label: 'Gérer les livraisons' },
              { v: 'paiement'  as QuizDouleur, label: "Encaisser et suivre l'argent" },
              { v: 'chiffres'  as QuizDouleur, label: 'Comprendre mes chiffres et bénéfices' },
            ]).map(({ v, label }) => (
              <button key={v} style={tileRowStyle(s.douleur === v)}
                onClick={() => setS(prev => ({ ...prev, douleur: v }))}>
                <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>
                  {v === 'clients' ? '🧲' : v === 'livraison' ? '🛵' : v === 'paiement' ? '💸' : '🧮'}
                </span>
                <span>{label}</span>
              </button>
            ))}
          </div>
          {s.douleur && <Preuve html={PREUVES_DOULEUR[s.douleur]} />}
          <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            <button style={{ ...blueBtn, ...(!s.douleur ? disabledStyle : {}) }} disabled={!s.douleur}
              onClick={() => goTo(6)}>
              Créer ma boutique →
            </button>
          </div>
        </div>
      )}

      {/* ── Écran 6 — Construction ───────────────────────────────────── */}
      {s.step === 6 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', padding: '26px 22px 30px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto', border: `5px solid ${BLP}`, borderTopColor: BL, animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <h2 style={{ fontFamily: 'var(--font-landing-display, var(--font-display))', fontSize: 'clamp(1.5rem,6vw,1.9rem)', fontWeight: 700, letterSpacing: '-0.02em', marginTop: 26 }}>
            On construit <span style={{ color: BL }}>{s.nom}</span>…
          </h2>
          <ul style={{ listStyle: 'none', textAlign: 'left', maxWidth: 300, margin: '26px auto 0', padding: 0 }}>
            {[
              'Ta page boutique au format mobile',
              paysData ? `Tes moyens de paiement (${paysData.paieText})` : 'Tes moyens de paiement',
              'Le paiement à la livraison + suivi livreur',
              'Ton Assistant IA personnel',
            ].map((item, i) => (
              <li key={i} style={{ padding: '10px 0', display: 'flex', gap: 12, alignItems: 'center', fontSize: '.98rem', fontWeight: 600, color: builtItems.includes(i) ? NT : '#B4BFCF', transition: 'color .3s' }}>
                <span>{builtItems.includes(i) ? '✅' : '○'}</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Écran 7 — Carte boutique ─────────────────────────────────── */}
      {s.step === 7 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '26px 22px 30px' }}>
          <h2 style={{ fontFamily: 'var(--font-landing-display, var(--font-display))', fontSize: 'clamp(1.5rem,6vw,1.9rem)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 4 }}>
            🎉{' '}<span style={{ color: BL }}>{s.nom}</span>{' '}est presque prête&nbsp;!
          </h2>
          <p style={{ color: GR, fontSize: '.9rem', marginBottom: 16 }}>
            Une seule étape te sépare de ta première vente.
          </p>
          <div style={{ border: `1px solid ${LN}`, borderRadius: 20, padding: 20, background: `linear-gradient(180deg,#fff,${BLP})`, textAlign: 'center', boxShadow: '0 16px 40px rgba(11,27,50,.08)' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: NT, color: '#fff', margin: '0 auto 12px', display: 'grid', placeItems: 'center', fontSize: '1.8rem' }}>
              {s.cat ? CAT_EMO[s.cat] : '🛍️'}
            </div>
            <h3 style={{ fontFamily: 'var(--font-landing-display, var(--font-display))', fontSize: '1.4rem', fontWeight: 700 }}>{s.nom}</h3>
            <div style={{ fontSize: '.85rem', color: BLD, fontWeight: 700, marginTop: 4 }}>
              tekki.shop/{previewSlug}
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 }}>
              {[...(paysData?.badges ?? []), '💵 À la livraison', '🛵 Suivi livreur', '🤖 Assistant IA'].map(b => (
                <span key={b} style={{ fontSize: '.72rem', fontWeight: 700, background: '#fff', border: `1px solid ${LN}`, borderRadius: 99, padding: '5px 11px' }}>{b}</span>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: '.82rem', fontWeight: 700, color: VT, marginBottom: 6 }}>
                Boutique prête à {gaugePct}%
              </div>
              <div style={{ height: 8, background: LN, borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${gaugeW}%`, background: VT, borderRadius: 99, transition: 'width 1s ease .3s' }} />
              </div>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <button style={blueBtn} onClick={() => goTo(8)}>Créer mon compte 🔐</button>
          </div>
        </div>
      )}

      {/* ── Écran 8 — Créer ton compte ───────────────────────────────── */}
      {s.step === 8 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '26px 22px 30px' }}>
          <h2 style={{ fontFamily: 'var(--font-landing-display, var(--font-display))', fontSize: 'clamp(1.5rem,6vw,1.9rem)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 8 }}>
            Crée ton compte
          </h2>
          <p style={{ color: GR, fontSize: '.95rem', marginBottom: 28 }}>
            Pour accéder à ta boutique{' '}<b style={{ color: NT }}>{s.nom}</b>{' '}depuis n&apos;importe quel appareil.
          </p>

          {/* Numéro WhatsApp */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 700, color: NT, marginBottom: 8 }}>
              Ton numéro WhatsApp
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ borderWidth: 2, borderStyle: 'solid', borderColor: LN, borderRadius: 16, padding: '0 14px', display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: '1rem', background: '#F9FAFB', whiteSpace: 'nowrap', color: NT }}>
                {paysData?.flag}{' '}{paysData?.dialCode}
              </div>
              <input
                type="tel" inputMode="tel"
                placeholder={s.pays === 'CI' ? '07 00 00 00 00' : s.pays === 'SN' ? '77 000 00 00' : '00 00 00 00'}
                value={s.localNum}
                onChange={e => setS(prev => ({ ...prev, localNum: e.target.value }))}
                style={{ flex: 1, borderWidth: 2, borderStyle: 'solid', borderColor: LN, borderRadius: 16, padding: '14px 16px', fontFamily: 'inherit', fontSize: '1.05rem', fontWeight: 600, color: NT, outline: 'none' }}
              />
            </div>
          </div>

          {/* Code PIN */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 700, color: NT, marginBottom: 8 }}>
              Choisis un code PIN à 6 chiffres
            </label>
            <p style={{ fontSize: '.82rem', color: GR, marginBottom: 12 }}>
              Ce code te sert à te connecter. Mémorise-le.
            </p>
            <PinInput name="pin" onChange={val => setS(prev => ({ ...prev, pin: val }))} />
          </div>

          {s.error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: '.9rem', color: '#DC2626' }}>
              {s.error}
            </div>
          )}

          {/* Badges de réassurance */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 16, fontSize: '.8rem', color: GR }}>
            {[
              `+${shopCount.toLocaleString('fr-FR')} boutiques créées`,
              'Création gratuite',
              'Aucun engagement',
            ].map(t => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: VT, fontWeight: 800 }}>✓</span> {t}
              </span>
            ))}
          </div>

          <button
            style={{ ...greenBtn, ...(s.localNum.replace(/\D/g, '').length < 8 || s.pin.length < 6 || s.submitting ? disabledStyle : {}) }}
            disabled={s.localNum.replace(/\D/g, '').length < 8 || s.pin.length < 6 || s.submitting}
            onClick={() => void handleSubmit()}
          >
            {s.submitting ? 'Création en cours…' : 'Ouvrir ma boutique 🎉'}
          </button>

          <Link href="/login" style={{ display: 'block', textAlign: 'center', marginTop: 14, fontSize: '.85rem', color: GR, textDecoration: 'underline' }}>
            J&apos;ai déjà un compte
          </Link>
        </div>
      )}
    </div>
  )
}
