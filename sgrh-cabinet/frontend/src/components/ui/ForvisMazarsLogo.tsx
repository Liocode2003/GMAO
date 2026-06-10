interface LogoProps {
  variant?: 'color' | 'white';
  className?: string;
  height?: number;
}

export default function ForvisMazarsLogo({ variant = 'color', className = '', height = 44 }: LogoProps) {
  return (
    <img
      src={variant === 'white' ? '/logo-white.svg' : '/logo.jpg'}
      alt="Forvis Mazars"
      height={height}
      className={className}
      style={{ height, width: 'auto' }}
    />
  );
}
