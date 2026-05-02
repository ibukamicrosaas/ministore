import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import {
  MessageCircle, BarChart3,
  CheckCircle2, ChevronDown, ArrowRight, Star,
  Users, Scissors, Smartphone, Calendar, Clock, Link2,
  Bell, CreditCard
} from 'lucide-react'
import { AnimatedPhoneMockup } from '@/components/landing/AnimatedPhoneMockup'
import { TestimonialsCarousel } from '@/components/landing/TestimonialsCarousel'
import { PaymentScroll } from '@/components/landing/PaymentScroll'

export const metadata = {
  title: 'Sheka — Mettez votre salon en ligne et gérez tout depuis votre téléphone',
  description: 'Créez en quelques minutes une page de réservation pour votre salon. Vos clientes réservent, paient par Wave ou Orange Money, reçoivent un rappel WhatsApp. Tout depuis votre téléphone.',
}

export default async function LandingPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A0A00]">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-[#FAF7F2]/90 backdrop-blur-sm border-b border-[#1A0A00]/6">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E85D04]">
              <Scissors className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight">Sheka</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-xl bg-[#E85D04] px-4 py-2 text-sm font-semibold text-white hover:bg-[#D45200] transition-colors"
              >
                Mon salon <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block text-sm font-medium text-[#1A0A00]/50 hover:text-[#E85D04] transition-colors">
                  Connexion
                </Link>
                <Link
                  href="/login"
                  className="rounded-xl bg-[#E85D04] px-4 py-2 text-sm font-semibold text-white hover:bg-[#D45200] transition-colors"
                >
                  Mettre mon salon en ligne
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-4 pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[#E85D04]/8 blur-3xl pointer-events-none" />
        <div className="absolute top-40 -left-16 h-52 w-52 rounded-full bg-amber-200/40 blur-2xl pointer-events-none" />

        <div className="relative mx-auto max-w-5xl">
          <div className="md:grid md:grid-cols-2 md:gap-16 md:items-center">

            {/* Texte */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E85D04]/25 bg-orange-50 px-3 py-1.5 mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E85D04] animate-pulse" />
                <span className="text-xs font-semibold text-[#E85D04]">Conçu pour les salons de beauté</span>
              </div>

              <h1 className="font-[family-name:var(--font-display)] text-4xl font-black leading-[1.1] tracking-tight md:text-5xl lg:text-[3.2rem]">
                Mettez votre salon en ligne et gérez vos clientes
                <span className="italic text-[#E85D04]"> depuis votre téléphone.</span>
              </h1>

              <p className="mt-5 text-base leading-relaxed text-[#1A0A00]/55 md:text-lg">
                Créez en quelques minutes un site pour votre salon, envoyez le lien à vos clientes, et recevez les réservations et paiements automatiquement.
              </p>

              <div className="mt-8 flex flex-col items-start gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 rounded-2xl bg-[#E85D04] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#E85D04]/25 hover:bg-[#D45200] transition-all active:scale-[0.98]"
                  >
                    Mettre mon salon en ligne
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-[#1A0A00]/40">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  Inscription avec numéro de téléphone. Aucun paiement requis.
                </p>
              </div>

              {/* 4 bullets de réassurance */}
              <div className="mt-8 grid grid-cols-2 gap-2.5">
                {[
                  'Création en moins de 5 minutes',
                  '100% gérable depuis le téléphone',
                  'Lien partageable sur WhatsApp',
                  'Rappels automatiques aux clientes',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-[#1A0A00]/60">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#E85D04] shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              {/* Social proof */}
              <div className="mt-8 flex items-center gap-4 border-t border-[#1A0A00]/8 pt-6">
                <div className="flex -space-x-2">
                  {[
                    { src: '/avatars/1.jpg', initiale: 'A', color: '#E85D04' },
                    { src: '/avatars/2.jpg', initiale: 'F', color: '#D97706' },
                    { src: '/avatars/3.jpg', initiale: 'R', color: '#059669' },
                    { src: '/avatars/4.jpg', initiale: 'K', color: '#DB2777' },
                    { src: '/avatars/5.jpg', initiale: 'N', color: '#2563EB' },
                  ].map((a, i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-[#FAF7F2] overflow-hidden shrink-0">
                      <Image
                        src={a.src}
                        alt=""
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-xs text-[#1A0A00]/45 mt-0.5">Dakar · Thiès · Abidjan · Bouaké</p>
                </div>
              </div>
            </div>

            {/* Phone mockup animé */}
            <div className="mt-16 md:mt-0 flex justify-center md:justify-end md:items-center">
              <div className="md:scale-[1.18] md:origin-right lg:scale-[1.28]">
                <AnimatedPhoneMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGOS PAIEMENT ── */}
      <section className="border-y border-[#1A0A00]/8 bg-white px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-[#1A0A00]/30 mb-5">
            Recevez vos paiements via
          </p>
          <PaymentScroll />
        </div>
      </section>

      {/* ── PROBLÈMES ── */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#E85D04] mb-3">Le problème</p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-black md:text-4xl">
              Beaucoup de salons perdent du temps et des clientes
              <span className="italic text-[#E85D04]"> à cause d&apos;une gestion inefficace.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: '📱',
                title: 'Les rendez-vous se gèrent dans les messages WhatsApp',
                desc: 'Entre les discussions, les confirmations et les oublis, vous passez des heures à gérer des messages qui ne rapportent rien.',
              },
              {
                icon: '🔁',
                title: 'Vos clientes demandent toujours les mêmes informations',
                desc: '« Quels sont vos services ? », « Quel est votre tarif ? » — les mêmes questions, encore et encore, chaque semaine.',
              },
              {
                icon: '😤',
                title: 'Certaines oublient leur rendez-vous ou annulent au dernier moment',
                desc: 'Sans acompte et sans rappel automatique, vous bloquez du temps pour des clientes qui ne viennent pas.',
              },
              {
                icon: '💸',
                title: 'Les acomptes et paiements ne sont pas bien organisés',
                desc: 'Pas de trace, pas de système. Certaines paient, d\'autres pas. Et vous ne savez plus toujours où vous en êtes.',
              },
              {
                icon: '📒',
                title: 'Les commissions des employées deviennent vite floues',
                desc: 'Cahier, calculatrice, WhatsApp... La fin de semaine est stressante. Et parfois, ça crée des tensions.',
              },
              {
                icon: '🧠',
                title: 'La patronne garde tout dans sa tête',
                desc: 'Horaires, disponibilités, tarifs, clientes régulières. Un seul oubli, et c\'est le chaos.',
              },
            ].map((problem, i) => (
              <div key={i} className="flex gap-4 rounded-2xl border border-[#1A0A00]/8 bg-white p-5 hover:border-[#E85D04]/30 hover:shadow-sm transition-all">
                <div className="text-2xl shrink-0 leading-none mt-0.5">{problem.icon}</div>
                <div>
                  <h3 className="text-sm font-bold text-[#1A0A00]">{problem.title}</h3>
                  <p className="mt-1 text-sm text-[#1A0A00]/50 leading-relaxed">{problem.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRANSFORMATION ── */}
      <section className="bg-[#1A0A00] px-4 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute -top-16 right-0 h-72 w-72 rounded-full bg-[#E85D04]/12 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-amber-500/8 blur-2xl pointer-events-none" />

        <div className="relative mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#E85D04] mb-3">La solution</p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-black text-white md:text-4xl">
              Avec Sheka, gérez votre activité de manière
              <span className="block italic text-[#E85D04]">efficace et professionnelle.</span>
            </h2>
            <p className="mt-4 text-sm text-white/45 max-w-xl mx-auto">
              Vos clientes réservent facilement, reçoivent leurs confirmations sur WhatsApp, et vous gérez votre activité depuis votre téléphone.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-[#E85D04]/30 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E85D04]/20 mb-4">
                <Link2 className="h-6 w-6 text-[#E85D04]" />
              </div>
              <h3 className="text-base font-bold text-white">Une page de réservation professionnelle pour votre salon</h3>
              <p className="mt-2 text-sm text-white/50 leading-relaxed">
                Vos clientes découvrent vos prestations, choisissent un créneau, réservent et paient plus facilement.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 mb-4">
                <MessageCircle className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-white">Moins de messages répétitifs sur WhatsApp</h3>
              <p className="mt-2 text-sm text-white/50 leading-relaxed">
                Vous partagez un seul lien dans vos conversations, sur WhatsApp Business et sur vos réseaux sociaux.
              </p>
            </div>

            <div className="rounded-2xl border border-green-500/30 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/20 mb-4">
                <Smartphone className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-base font-bold text-white">Une activité mieux gérée au quotidien</h3>
              <p className="mt-2 text-sm text-white/50 leading-relaxed">
                Services, employées, commissions, réservations et horaires : tout est centralisé dans un seul espace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section id="comment-ca-marche" className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#E85D04] mb-3">En pratique</p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-black md:text-4xl">
              Commencez aujourd&apos;hui.
              <span className="italic text-[#E85D04]"> Depuis votre téléphone.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: '01',
                icon: <Scissors className="h-5 w-5 text-[#E85D04]" />,
                title: 'Mettez votre salon en ligne en quelques minutes',
                desc: 'Inscrivez-vous avec votre numéro de téléphone et un code PIN, comme avec les apps que vous utilisez déjà.',
              },
              {
                n: '02',
                icon: <Calendar className="h-5 w-5 text-amber-600" />,
                title: 'Ajoutez vos prestations et vos horaires',
                desc: 'Coiffure, makeup, onglerie, soins… indiquez vos services, vos prix et vos disponibilités.',
              },
              {
                n: '03',
                icon: <Link2 className="h-5 w-5 text-green-600" />,
                title: 'Partagez votre lien de réservation',
                desc: 'Envoyez-le sur WhatsApp, ajoutez-le à votre profil WhatsApp Business ou publiez-le sur vos réseaux sociaux.',
              },
              {
                n: '04',
                icon: <Bell className="h-5 w-5 text-blue-600" />,
                title: 'Recevez vos réservations automatiquement',
                desc: 'Vos clientes réservent, reçoivent une confirmation et un rappel WhatsApp avant leur rendez-vous.',
              },
            ].map((step) => (
              <div key={step.n} className="relative rounded-2xl border border-[#1A0A00]/8 bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-[family-name:var(--font-display)] text-4xl font-black text-[#1A0A00]/6 leading-none select-none">
                    {step.n}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF7F2]">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-sm font-bold text-[#1A0A00]">{step.title}</h3>
                <p className="mt-2 text-sm text-[#1A0A00]/50 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-2xl bg-[#E85D04] px-8 py-4 text-base font-bold text-white hover:bg-[#D45200] transition-colors shadow-lg shadow-[#E85D04]/20"
            >
              Mettre mon salon en ligne
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── BÉNÉFICES ── */}
      <section className="bg-[#FAF7F2] border-t border-[#1A0A00]/6 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#E85D04] mb-3">Ce que vous gagnez</p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-black md:text-4xl">
              Tout ce qu&apos;il faut pour faire tourner
              <span className="italic text-[#E85D04]"> votre activité plus facilement.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Grande carte */}
            <div className="md:row-span-2 rounded-3xl bg-gradient-to-br from-[#E85D04] to-[#B34500] p-6 text-white flex flex-col justify-between min-h-[280px]">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 mb-4">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight">
                  Recevez des réservations 24h/24
                </h3>
                <p className="mt-3 text-sm text-white/70 leading-relaxed">
                  Même quand vous êtes occupée avec une cliente, vous pouvez continuer à prendre des rendez-vous, sans que vous ayez à décrocher votre téléphone.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {['Wave', 'Orange Money', 'MTN Money', 'Carte bancaire'].map(m => (
                  <span key={m} className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">{m}</span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 mb-3">
                <Link2 className="h-5 w-5 text-amber-700" />
              </div>
              <h3 className="text-base font-bold text-[#1A0A00]">Envoyez le bon lien en un clic</h3>
              <p className="mt-2 text-sm text-[#1A0A00]/50 leading-relaxed">
                Depuis votre tableau de bord, partagez directement votre page de réservation sur WhatsApp. Vos clientes réservent sans télécharger d&apos;application.
              </p>
            </div>

            <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 mb-3">
                <Bell className="h-5 w-5 text-green-700" />
              </div>
              <h3 className="text-base font-bold text-[#1A0A00]">Rappelez automatiquement vos clientes</h3>
              <p className="mt-2 text-sm text-[#1A0A00]/50 leading-relaxed">
                Les confirmations et rappels WhatsApp limitent les oublis et les rendez-vous manqués. Moins de no-show, plus de revenus.
              </p>
            </div>

            <div className="rounded-3xl border border-purple-200 bg-purple-50 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 mb-3">
                <Users className="h-5 w-5 text-purple-700" />
              </div>
              <h3 className="text-base font-bold text-[#1A0A00]">Gardez le contrôle sur vos employées</h3>
              <p className="mt-2 text-sm text-[#1A0A00]/50 leading-relaxed">
                Ajoutez votre équipe, attribuez les prestations et suivez les commissions automatiquement. Fini les disputes en fin de semaine.
              </p>
            </div>

            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 mb-3">
                <CreditCard className="h-5 w-5 text-blue-700" />
              </div>
              <h3 className="text-base font-bold text-[#1A0A00]">Encaissez plus sereinement</h3>
              <p className="mt-2 text-sm text-[#1A0A00]/50 leading-relaxed">
                Demandez un acompte au moment de la réservation. Vos clientes paient par Wave, Orange Money ou carte. Vous encaissez en toute sécurité.
              </p>
            </div>

            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 mb-3">
                <Smartphone className="h-5 w-5 text-rose-700" />
              </div>
              <h3 className="text-base font-bold text-[#1A0A00]">Tout est dans votre téléphone</h3>
              <p className="mt-2 text-sm text-[#1A0A00]/50 leading-relaxed">
                Pas besoin d&apos;ordinateur. Gérez votre salon où que vous soyez — au salon, à domicile, en déplacement.
              </p>
            </div>

            <div className="rounded-3xl border border-[#1A0A00]/10 bg-white p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FAF7F2] mb-3">
                <BarChart3 className="h-5 w-5 text-[#1A0A00]/60" />
              </div>
              <h3 className="text-base font-bold text-[#1A0A00]">Pilotez votre activité en un coup d&apos;œil</h3>
              <p className="mt-2 text-sm text-[#1A0A00]/50 leading-relaxed">
                CA du jour, réservations à venir, services les plus demandés. Vous savez toujours où en est votre salon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── POUR QUI ── */}
      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#E85D04] mb-3">Pour qui ?</p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-black md:text-4xl">
            Pensé pour les salons de beauté
          </h2>
          <p className="mt-4 text-sm text-[#1A0A00]/50 leading-relaxed max-w-xl mx-auto">
            Que vous gériez un salon de coiffure, de makeup, d&apos;onglerie ou plusieurs prestations à la fois, Sheka vous aide à mieux organiser votre activité et à offrir une expérience plus professionnelle à vos clientes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {[
              { label: 'Coiffure', emoji: '✂️' },
              { label: 'Makeup', emoji: '💄' },
              { label: 'Onglerie', emoji: '💅' },
              { label: 'Soins', emoji: '🌿' },
              { label: 'Lash & Brow', emoji: '👁' },
              { label: 'Esthétique', emoji: '✨' },
            ].map(({ label, emoji }) => (
              <span key={label} className="flex items-center gap-1.5 rounded-full border border-[#1A0A00]/10 bg-white px-4 py-2 text-sm font-medium text-[#1A0A00]">
                <span>{emoji}</span> {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-[#E85D04] px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: '< 5 min', label: 'Pour mettre votre salon en ligne' },
              { value: '0 FCFA', label: 'Aucun paiement requis pour commencer' },
              { value: '24h/7j', label: 'Réservations reçues automatiquement' },
              { value: '14 jours', label: 'Pour tester gratuitement' },
            ].map((stat, i) => (
              <div key={i} className="text-center text-white">
                <p className="font-[family-name:var(--font-display)] text-3xl font-black">{stat.value}</p>
                <p className="mt-1 text-xs text-white/65">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ── */}
      <section className="bg-[#1A0A00] py-16 md:py-24 overflow-hidden">
        <div className="px-4 mb-10">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#E85D04] mb-3">Témoignages</p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-black text-white md:text-4xl">
              Ce que ça change dans leur quotidien.
            </h2>
            <p className="mt-2 text-sm text-white/40">Survolez un témoignage pour mettre en pause</p>
          </div>
        </div>
        <TestimonialsCarousel />
      </section>

      {/* ── PRICING ── */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#E85D04] mb-3">Tarifs</p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-black md:text-4xl">
              Commencez gratuitement.
              <span className="block italic text-[#E85D04]">Évoluez quand votre salon grandit.</span>
            </h2>
            <p className="mt-3 text-sm text-[#1A0A00]/45">14 jours gratuits sur tous les plans. Aucun paiement requis.</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <PricingCard
              plan="Starter"
              price="4 900"
              description="Pour démarrer seule ou en petit salon"
              features={[
                '1 mini site',
                "Jusqu'à 3 employées",
                'Réservations illimitées',
                'Paiements Wave & Orange Money',
                'Rappels WhatsApp automatiques',
                'Lien de réservation partageable',
              ]}
              ctaLabel="Commencer gratuitement"
              highlighted={false}
            />
            <PricingCard
              plan="Pro"
              price="9 900"
              description="Idéal pour les salons qui ont +3 employés"
              features={[
                '1 mini site',
                'Employées illimitées',
                'Commissions automatiques',
                'Tableau de bord avancé',
                'Export des rapports',
                'Support prioritaire WhatsApp',
              ]}
              ctaLabel="Essayer 14 jours gratuits"
              highlighted={true}
            />
            <PricingCard
              plan="Multi-salon"
              price="19 900"
              description="Pour les chaînes et multi-activités"
              features={[
                "Jusqu'à 5 mini sites",
                'Tout inclus du plan Pro',
                'Tableau de bord centralisé',
                'Statistiques par salon',
                'Manager dédié',
              ]}
              ctaLabel="Commencer gratuitement"
              highlighted={false}
            />
          </div>

          <p className="text-center mt-6 text-xs text-[#1A0A00]/35">
            Vous ne savez pas quel plan choisir ? Commencez par Starter — vous pouvez évoluer à tout moment.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-[#1A0A00]/6 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#E85D04] mb-3">FAQ</p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-black">Vos questions, nos réponses.</h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Est-ce que je peux tout gérer depuis mon téléphone ?",
                a: "Oui, à 100%. Sheka est conçu pour être utilisé depuis votre téléphone. Créer votre salon, ajouter vos services, consulter vos réservations, voir les commissions de vos employées — tout se fait depuis l'application mobile, sans ordinateur.",
              },
              {
                q: "Mes clientes doivent-elles télécharger une application ?",
                a: "Non. Vos clientes accèdent à votre page via un simple lien — exactement comme un lien WhatsApp. Aucun téléchargement, aucun compte à créer. Elles réservent directement depuis leur navigateur.",
              },
              {
                q: "Comment je partage ma page de réservation ?",
                a: "En un clic depuis votre tableau de bord. Vous copiez votre lien et vous l'envoyez sur WhatsApp, vous l'ajoutez à votre bio Instagram ou à votre profil WhatsApp Business. Vos clientes n'ont plus qu'à cliquer.",
              },
              {
                q: "Comment les rappels WhatsApp fonctionnent-ils ?",
                a: "Dès qu'une cliente réserve, elle reçoit une confirmation par WhatsApp. La veille du rendez-vous, elle reçoit automatiquement un rappel. Vous n'avez rien à faire — c'est entièrement automatique.",
              },
              {
                q: "Puis-je ajouter mes employées et suivre leurs commissions ?",
                a: "Oui. Vous ajoutez vos employées, définissez leur taux de commission par prestation, et Sheka calcule automatiquement ce que vous devez à chacune à la fin de la semaine. Plus de cahier, plus de disputes.",
              },
              {
                q: "En combien de temps mon salon peut-il être prêt ?",
                a: "La plupart des salons sont en ligne en moins de 5 minutes. Vous créez votre compte avec votre numéro de téléphone + code PIN, ajoutez vos services et vos horaires, et votre lien est immédiatement partageable.",
              },
              {
                q: "Faut-il une carte bancaire pour commencer ?",
                a: "Non. Vous commencez avec votre numéro de téléphone et un code PIN. Aucune carte bancaire, aucun engagement. Vous avez 14 jours gratuits pour tester Sheka sans aucune contrainte.",
              },
            ].map((faq, i) => (
              <FaqItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#E85D04] to-[#A84300] px-6 py-14 text-center md:px-16">
            <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-white/8" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/8" />
            <div className="absolute top-0 left-0 right-0 h-px bg-white/20" />
            <div className="relative">
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-black text-white leading-tight md:text-4xl">
                Mettez votre salon en ligne gratuitement et recevez votre 1ere réservation dès aujourd&apos;hui.
              </h2>
              <p className="mt-4 text-sm text-white/65">
                Inscription en 2 minutes · Numéro de téléphone + code PIN · Aucun paiement requis.
              </p>
              <Link
                href="/login"
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-[#E85D04] hover:bg-orange-50 transition-colors shadow-2xl shadow-black/20 active:scale-[0.98]"
              >
                Mettre mon salon en ligne
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-5 text-xs text-white/40">
                Vous avez déjà un compte ?{' '}
                <Link href="/login" className="underline underline-offset-2 hover:text-white transition-colors">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#1A0A00]/8 px-4 py-8">
        <div className="mx-auto max-w-5xl flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E85D04]">
              <Scissors className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold">Sheka</span>
          </div>
          <p className="text-xs text-[#1A0A00]/35 text-center">
            Pensé pour les salons de beauté africains · Dakar, Sénégal
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-[#1A0A00]/35 justify-center">
            <Link href="/login" className="hover:text-[#E85D04] transition-colors">Connexion</Link>
            <span>·</span>
            <Link href="/legal/cgu" className="hover:text-[#E85D04] transition-colors">CGU</Link>
            <span>·</span>
            <Link href="/legal/privacy" className="hover:text-[#E85D04] transition-colors">Confidentialité</Link>
            <span>·</span>
            <span>© 2026 Sheka</span>
          </div>
        </div>
      </footer>

    </div>
  )
}

/* ── Pricing card ── */
function PricingCard({
  plan, price, description, features, ctaLabel, highlighted
}: {
  plan: string
  price: string
  description: string
  features: string[]
  ctaLabel: string
  highlighted: boolean
}) {
  return (
    <div className={`relative rounded-3xl p-6 flex flex-col ${
      highlighted
        ? 'bg-[#1A0A00] shadow-2xl shadow-[#1A0A00]/20'
        : 'border border-[#1A0A00]/10 bg-white'
    }`}>
      {highlighted && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#E85D04] px-4 py-1 text-xs font-bold text-white whitespace-nowrap">
          Recommandé
        </div>
      )}
      <div>
        <p className={`text-xs font-semibold uppercase tracking-widest ${highlighted ? 'text-white/40' : 'text-[#1A0A00]/40'}`}>
          {plan}
        </p>
        <p className={`mt-3 font-[family-name:var(--font-display)] text-4xl font-black ${highlighted ? 'text-white' : 'text-[#1A0A00]'}`}>
          {price}
          <span className={`text-lg font-normal ${highlighted ? 'text-white/40' : 'text-[#1A0A00]/35'}`}> FCFA/mois</span>
        </p>
        <p className={`mt-1 text-xs ${highlighted ? 'text-white/40' : 'text-[#1A0A00]/40'}`}>{description}</p>
      </div>
      <ul className="mt-6 space-y-3 flex-1">
        {features.map(f => (
          <li key={f} className={`flex items-start gap-2 text-sm ${highlighted ? 'text-white/70' : 'text-[#1A0A00]/65'}`}>
            <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${highlighted ? 'text-[#E85D04]' : 'text-green-500'}`} />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/login"
        className={`mt-6 block rounded-2xl py-3 text-center text-sm font-bold transition-colors ${
          highlighted
            ? 'bg-[#E85D04] text-white hover:bg-[#D45200]'
            : 'border-2 border-[#E85D04] text-[#E85D04] hover:bg-orange-50'
        }`}
      >
        {ctaLabel}
      </Link>
    </div>
  )
}

/* ── FAQ Item ── */
function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-2xl border border-[#1A0A00]/8 bg-white overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-[#1A0A00] [&::-webkit-details-marker]:hidden">
        {question}
        <ChevronDown className="h-4 w-4 shrink-0 text-[#1A0A00]/30 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="border-t border-[#1A0A00]/5 px-5 py-4">
        <p className="text-sm text-[#1A0A00]/55 leading-relaxed">{answer}</p>
      </div>
    </details>
  )
}
