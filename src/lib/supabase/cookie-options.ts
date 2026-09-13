// Cookie de session Supabase — jamais lu via document.cookie nulle part dans
// l'app (vérifié, audit sécurité §109, finding élevé #4), httpOnly n'a donc
// aucune justification fonctionnelle à être false (défaut @supabase/ssr).
// secure sans condition d'environnement : Vercel sert production et preview
// en HTTPS ; le seul cas non-HTTPS (dev/test local sur http://localhost) est
// exempté par les navigateurs modernes (localhost traité comme contexte
// sécurisé), vérifié en conditions réelles avant application de ce fichier.
export const SESSION_COOKIE_OPTIONS = { httpOnly: true, secure: true } as const
