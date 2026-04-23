'use client'

import { trackWhatsAppClick } from '@/lib/trackEvent'

interface WhatsAppButtonProps {
  phone?: string
  message?: string
}

export function WhatsAppButton({
  phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '',
  message = 'হ্যালো! আমার সাহায্য দরকার।'
}: WhatsAppButtonProps) {
  const handleClick = () => {
    trackWhatsAppClick('floating_button')
    const cleanPhone = phone.replace(/[^\d+]/g, '')
    if (!cleanPhone) return
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`, '_blank')
  }

  return (
    <>
      <style>{`
        @keyframes wa-ping {
          0%   { transform: scale(1); opacity: 0.6; }
          70%  { transform: scale(1.7); opacity: 0; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        @keyframes wa-bounce {
          0%, 100% { transform: translateY(0); }
          30%       { transform: translateY(-6px); }
          60%       { transform: translateY(-2px); }
        }
        .wa-ping { animation: wa-ping 2s ease-out infinite; }
        .wa-icon { animation: wa-bounce 3s ease-in-out infinite; }
        .wa-btn:hover .wa-icon { animation: none; transform: scale(1.15); }
      `}</style>

      <button
        onClick={handleClick}
        aria-label="Contact us on WhatsApp"
        className="wa-btn fixed bottom-20 right-6 z-50 lg:bottom-6"
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        {/* Ping ring */}
        <span
          className="wa-ping absolute inset-0 rounded-full"
          style={{ backgroundColor: '#25D366', pointerEvents: 'none' }}
        />

        {/* Main button */}
        <span
          className="relative flex h-14 w-14 items-center justify-center rounded-full shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
          }}
        >
          {/* WhatsApp SVG icon */}
          <span className="wa-icon">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <path
                d="M16 2C8.268 2 2 8.268 2 16c0 2.494.65 4.836 1.79 6.862L2 30l7.338-1.762A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z"
                fill="white"
              />
              <path
                d="M16 4.5c-6.351 0-11.5 5.149-11.5 11.5 0 2.16.597 4.182 1.638 5.908l.245.41-1.04 3.79 3.896-1.02.394.233A11.453 11.453 0 0016 27.5c6.351 0 11.5-5.149 11.5-11.5S22.351 4.5 16 4.5z"
                fill="#25D366"
              />
              <path
                d="M11.93 10.5c-.26-.58-.535-.592-.782-.602-.203-.009-.435-.008-.667-.008-.232 0-.609.087-.928.435-.319.348-1.217 1.189-1.217 2.9 0 1.711 1.246 3.365 1.42 3.598.173.232 2.41 3.834 5.94 5.224 2.94 1.159 3.53.929 4.167.871.638-.058 2.058-.841 2.348-1.654.29-.812.29-1.508.203-1.654-.087-.145-.319-.232-.667-.406-.348-.174-2.058-1.016-2.377-1.131-.319-.116-.551-.174-.783.174-.232.348-.899 1.131-1.101 1.363-.203.232-.406.261-.754.087-.348-.174-1.469-.541-2.798-1.727-1.034-.922-1.732-2.06-1.935-2.408-.203-.348-.022-.536.152-.709.158-.155.348-.406.522-.609.173-.203.231-.348.347-.58.116-.232.058-.435-.029-.609-.087-.174-.77-1.886-1.07-2.574z"
                fill="white"
              />
            </svg>
          </span>
        </span>
      </button>
    </>
  )
}
