import Link from 'next/link'
import Image from 'next/image'
import { ResetPinForm } from './ResetPinForm'
import { APP_NAME } from '@/constants'

export const metadata = { title: `Réinitialisation PIN — ${APP_NAME}` }

export default function ResetPinPage() {
  return (
    <>
      <style>{`
        .rp{min-height:100vh;display:flex;flex-direction:column;background:radial-gradient(circle at 85% 5%,rgba(24,107,255,.055) 0%,transparent 22%),#fff;font-family:"Inter",ui-sans-serif,system-ui,sans-serif}
        .rp-top{display:flex;align-items:center;justify-content:space-between;padding:18px 32px;border-bottom:1px solid #f0f4f9;flex-shrink:0}
        .rp-body{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px}
        .rp-wrap{width:min(100%,440px)}
        .rp-heading{text-align:center;margin-bottom:28px}
        .rp-mini{width:52px;height:52px;border-radius:16px;background:linear-gradient(145deg,#eaf4ff,#fff);border:1px solid #cce5f8;display:grid;place-items:center;margin:0 auto 16px;overflow:hidden}
        .rp-h1{font-family:var(--lv6-display,"Bricolage Grotesque","Inter",system-ui,sans-serif);font-size:26px;font-weight:800;color:#0b1830;letter-spacing:-.035em;margin:0 0 8px}
        .rp-sub{color:#697893;font-size:14.5px;margin:0;line-height:1.55}
        .rp-terms{margin-top:20px;text-align:center;color:#9ba8bc;font-size:11.5px;line-height:1.6}
        .rp-terms a{text-decoration:underline;color:inherit}
        @media(max-width:480px){.rp-top{padding:14px 20px}.rp-body{padding:28px 16px}.rp-h1{font-size:23px}}
      `}</style>
      <div className="rp">
        <div className="rp-top">
          <Link href="/">
            <Image src="/logo.svg" alt={APP_NAME} width={130} height={36} style={{ height: 36, width: 'auto' }} />
          </Link>
          <Link href="/login" style={{ fontSize: 13, color: '#697893', fontWeight: 600 }}>
            ← Retour à la connexion
          </Link>
        </div>

        <div className="rp-body">
          <div className="rp-wrap">
            <div className="rp-heading">
              <div className="rp-mini">
                <Image src="/icone-tekkishop.svg" alt={APP_NAME} width={34} height={34} />
              </div>
              <h1 className="rp-h1">Réinitialiser ton PIN</h1>
              <p className="rp-sub">
                Saisis ton numéro de téléphone.<br />
                Tu recevras un code par SMS pour créer un nouveau PIN.
              </p>
            </div>

            <ResetPinForm />

            <p className="rp-terms">
              En continuant, tu acceptes nos{' '}
              <Link href="/legal/cgu">CGU</Link>
              {' '}et notre{' '}
              <Link href="/legal/privacy">politique de confidentialité</Link>.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
