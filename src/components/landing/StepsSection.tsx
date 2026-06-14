export function StepsSection() {
  return (
    <section id="comment" className="py-20 px-4" style={{ background: 'linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)' }}>
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] mb-3">C'est simple</p>
          <h2
            className="text-3xl sm:text-4xl font-black text-gray-900 mb-3"
            style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
          >
            Ça marche en 4 étapes
          </h2>
          <p className="text-gray-500 max-w-sm mx-auto text-sm">
            Pas besoin d&apos;un développeur. Pas besoin d&apos;un ordinateur.
          </p>
        </div>

        <div className="space-y-12 lg:space-y-20">
          {/* Étape 1 */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            <div className="flex-1 lg:order-1 order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white text-sm font-black shadow-lg shadow-sky-200">01</div>
                <div className="h-px flex-1 bg-gradient-to-r from-sky-200 to-transparent hidden lg:block" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>
                Crée ton site
              </h3>
              <p className="text-gray-500 leading-relaxed mb-5">
                Tu donnes le nom de ton business, tu ajoutes tes produits avec description, photo et prix. Tu mets le site en ligne. <strong className="text-gray-700">Ça prend 5 minutes.</strong>
              </p>
              <ul className="space-y-2">
                {['Nom + logo de ta boutique', 'Photos et prix de tes produits', 'Couleur aux couleurs de ton business'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-shrink-0 lg:order-2 order-1 w-full max-w-xs lg:max-w-sm">
              <Step1Illustration />
            </div>
          </div>

          {/* Étape 2 */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            <div className="flex-shrink-0 w-full max-w-xs lg:max-w-sm">
              <Step2Illustration />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500 text-white text-sm font-black shadow-lg shadow-violet-200">02</div>
                <div className="h-px flex-1 bg-gradient-to-r from-violet-200 to-transparent hidden lg:block" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>
                Active ton site
              </h3>
              <p className="text-gray-500 leading-relaxed mb-5">
                Active ton site pour que tes clients puissent voir tous tes produits et passer commande. Ils reçoivent une <strong className="text-gray-700">confirmation automatique par WhatsApp.</strong>
              </p>
              <ul className="space-y-2">
                {['Active en un clic depuis ton téléphone', 'Ton lien unique est prêt à partager', 'Les commandes arrivent directement'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Étape 3 */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            <div className="flex-1 lg:order-1 order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white text-sm font-black shadow-lg shadow-amber-200">03</div>
                <div className="h-px flex-1 bg-gradient-to-r from-amber-200 to-transparent hidden lg:block" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>
                Partage ton lien
              </h3>
              <p className="text-gray-500 leading-relaxed mb-5">
                Tu envoies ton lien à tes clients, et tu l&apos;ajoutes sur WhatsApp, Instagram ou Facebook. <strong className="text-gray-700">Tes clients cliquent et commandent directement.</strong>
              </p>
              <ul className="space-y-2">
                {['Copie-colle ton lien sur WhatsApp', 'Partage sur Instagram ou Facebook', 'Tes clients commandent sans appli'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-shrink-0 lg:order-2 order-1 w-full max-w-xs lg:max-w-sm">
              <Step3Illustration />
            </div>
          </div>

          {/* Étape 4 */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            <div className="flex-shrink-0 w-full max-w-xs lg:max-w-sm">
              <Step4Illustration />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white text-sm font-black shadow-lg shadow-emerald-200">04</div>
                <div className="h-px flex-1 bg-gradient-to-r from-emerald-200 to-transparent hidden lg:block" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>
                Reçois tes paiements
              </h3>
              <p className="text-gray-500 leading-relaxed mb-5">
                Tes clients paient par Wave, Orange Money, ou à la livraison. <strong className="text-gray-700">L&apos;argent arrive directement sur ton téléphone. C&apos;est automatique.</strong>
              </p>
              <ul className="space-y-2">
                {['Wave, Orange Money, Maxit', 'Paiement à la livraison possible', 'Tu vois tout dans ton tableau de bord'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Illustrations SVG ── */

function Step1Illustration() {
  return (
    <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-sky-100 border border-sky-100">
      <div className="bg-gradient-to-br from-sky-50 to-white p-6">
        {/* Header mockup */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-2 w-2 rounded-full bg-red-300" />
          <div className="h-2 w-2 rounded-full bg-yellow-300" />
          <div className="h-2 w-2 rounded-full bg-green-300" />
          <div className="flex-1 mx-2 h-5 rounded-md bg-sky-100/80 flex items-center px-2">
            <span className="text-[9px] text-sky-400 font-medium">tekki.shop/mon-business</span>
          </div>
        </div>
        {/* Form mockup */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Crée ta boutique</p>
          <div className="space-y-2.5">
            <div>
              <p className="text-[9px] text-gray-400 mb-1">Nom de ta boutique</p>
              <div className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 flex items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-800">Keur Mode Dakar</span>
                <span className="ml-auto h-3.5 w-0.5 bg-sky-500 animate-pulse" />
              </div>
            </div>
            <div>
              <p className="text-[9px] text-gray-400 mb-1">Ton WhatsApp</p>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <span className="text-[11px] text-gray-600">+221 77 000 00 00</span>
              </div>
            </div>
            <div>
              <p className="text-[9px] text-gray-400 mb-1">Couleur de ta boutique</p>
              <div className="flex gap-1.5">
                {['bg-sky-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500'].map((c, i) => (
                  <div key={i} className={`h-5 w-5 rounded-full ${c} ${i === 0 ? 'ring-2 ring-offset-1 ring-sky-500' : ''}`} />
                ))}
              </div>
            </div>
            <button className="w-full rounded-xl bg-sky-500 py-2 text-[11px] font-bold text-white shadow-sm">
              Créer mon site →
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <p className="text-[10px] text-emerald-600 font-semibold">Prend moins de 5 minutes</p>
        </div>
      </div>
    </div>
  )
}

function Step2Illustration() {
  return (
    <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-violet-100 border border-violet-100">
      <div className="bg-gradient-to-br from-violet-50 to-white p-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-gray-800">Mon tableau de bord</p>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] text-emerald-600 font-semibold">En ligne</span>
            </div>
          </div>
          {/* Products list */}
          {[
            { name: 'Robe wax bleue', price: '12 000', stock: 8, active: true },
            { name: 'Sac bandoulière', price: '8 500', stock: 3, active: true },
            { name: 'Chaussures sandales', price: '6 000', stock: 0, active: false },
          ].map((p) => (
            <div key={p.name} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
              <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center text-sm shrink-0">🛍️</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-gray-800 truncate">{p.name}</p>
                <p className="text-[9px] text-gray-400">{p.price} FCFA · stock: {p.stock}</p>
              </div>
              <div className={`h-4 w-7 rounded-full ${p.active ? 'bg-emerald-400' : 'bg-gray-200'} relative shrink-0`}>
                <div className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all ${p.active ? 'left-3.5' : 'left-0.5'}`} />
              </div>
            </div>
          ))}
          <div className="mt-3 rounded-xl bg-violet-50 border border-violet-100 p-2.5 text-center">
            <p className="text-[10px] font-bold text-violet-700">✅ Ton site est visible par tes clients</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Step3Illustration() {
  return (
    <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-amber-100 border border-amber-100">
      <div className="bg-gradient-to-br from-amber-50 to-white p-6">
        {/* WhatsApp mockup */}
        <div className="bg-[#111b21] rounded-2xl overflow-hidden">
          <div className="bg-[#202c33] px-3 py-2 flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-amber-400 flex items-center justify-center text-xs font-bold text-white">M</div>
            <div>
              <p className="text-white text-[10px] font-semibold">Ma boutique</p>
              <p className="text-white/40 text-[8px]">en ligne</p>
            </div>
          </div>
          <div className="p-3 space-y-2">
            {/* Message reçu */}
            <div className="max-w-[85%] rounded-tl-lg rounded-tr-lg rounded-br-lg bg-[#202c33] p-2.5">
              <p className="text-white/80 text-[10px]">Bonsoir ! C'est quoi ton lien pour commander ?</p>
              <p className="text-white/30 text-[8px] text-right mt-1">18:32</p>
            </div>
            {/* Message envoyé */}
            <div className="max-w-[85%] ml-auto rounded-tl-lg rounded-tr-lg rounded-bl-lg bg-[#005c4b] p-2.5">
              <p className="text-white text-[10px]">Voilà mon site 👇</p>
              <div className="mt-1.5 rounded-md bg-[#025C4C] p-2 border border-white/10">
                <p className="text-amber-300 text-[9px] font-bold">🛍️ tekki.shop/keur-mode</p>
                <p className="text-white/60 text-[8px]">Commande directement ici !</p>
              </div>
              <p className="text-white/30 text-[8px] text-right mt-1">18:33 ✓✓</p>
            </div>
            {/* Réponse */}
            <div className="max-w-[85%] rounded-tl-lg rounded-tr-lg rounded-br-lg bg-[#202c33] p-2.5">
              <p className="text-white/80 text-[10px]">Waaaw c'est beau ! Je commande tout de suite 😍</p>
              <p className="text-white/30 text-[8px] text-right mt-1">18:35</p>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <span className="text-sm">📲</span>
          <p className="text-[10px] text-gray-500 font-medium">Partage sur WhatsApp, Insta, Facebook</p>
        </div>
      </div>
    </div>
  )
}

function Step4Illustration() {
  return (
    <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-emerald-100 border border-emerald-100">
      <div className="bg-gradient-to-br from-emerald-50 to-white p-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Tes revenus</p>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="rounded-xl bg-emerald-50 p-2.5 border border-emerald-100">
              <p className="text-[9px] text-emerald-600 font-medium">Aujourd'hui</p>
              <p className="text-base font-black text-emerald-700">47 500</p>
              <p className="text-[8px] text-emerald-500">FCFA reçus</p>
            </div>
            <div className="rounded-xl bg-sky-50 p-2.5 border border-sky-100">
              <p className="text-[9px] text-sky-600 font-medium">Ce mois</p>
              <p className="text-base font-black text-sky-700">312 000</p>
              <p className="text-[8px] text-sky-500">FCFA reçus</p>
            </div>
          </div>
          {/* Payments */}
          <div className="space-y-1.5">
            {[
              { method: '🟦 Wave', amount: '+12 000', time: 'Il y a 5 min', color: 'text-blue-600' },
              { method: '🟠 Orange Money', amount: '+8 500', time: 'Il y a 23 min', color: 'text-orange-500' },
              { method: '🟦 Wave', amount: '+15 000', time: 'Il y a 1h', color: 'text-blue-600' },
            ].map((t) => (
              <div key={t.time} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm">{t.method.split(' ')[0]}</span>
                <div className="flex-1">
                  <p className="text-[10px] text-gray-600">{t.method.split(' ').slice(1).join(' ')}</p>
                  <p className="text-[8px] text-gray-400">{t.time}</p>
                </div>
                <p className={`text-[11px] font-bold ${t.color}`}>{t.amount} FCFA</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-[10px] text-emerald-600 font-semibold">L'argent arrive sur ton téléphone</p>
        </div>
      </div>
    </div>
  )
}
