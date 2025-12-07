import Link from 'next/link'

interface CTAButtonProps {
  text: string
  href: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function CTAButton({ 
  text, 
  href, 
  variant = 'primary', 
  size = 'lg',
  className = '' 
}: CTAButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg'
  
  const variants = {
    primary: 'bg-[#036666] text-white hover:bg-[#024d4d] shadow-md',
    secondary: 'bg-white text-[#036666] border-2 border-[#036666] hover:bg-[#036666] hover:text-white',
    outline: 'bg-transparent text-[#036666] border-2 border-[#036666] hover:bg-[#036666] hover:text-white'
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  return (
    <Link 
      href={href}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {text}
    </Link>
  )
}
