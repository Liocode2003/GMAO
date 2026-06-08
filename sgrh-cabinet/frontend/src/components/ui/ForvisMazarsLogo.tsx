interface LogoProps {
  variant?: 'color' | 'white';
  className?: string;
  height?: number;
}

export default function ForvisMazarsLogo({ variant = 'color', className = '', height = 44 }: LogoProps) {
  const isWhite = variant === 'white';
  const forvisColor  = isWhite ? '#ffffff' : '#1A89D4';
  const mazarsColor  = isWhite ? 'rgba(255,255,255,0.92)' : '#1E2D72';
  const fontSize = height * 0.48;
  const lineH    = height * 0.52;

  return (
    <div
      className={className}
      style={{
        fontFamily: "'Nunito', 'Arial Rounded MT Bold', 'Century Gothic', Arial, sans-serif",
        fontWeight: 900,
        lineHeight: 1,
        userSelect: 'none',
        display: 'inline-block',
      }}
    >
      {/* forv/s */}
      <div style={{ color: forvisColor, fontSize, letterSpacing: '-0.03em', height: lineH, display: 'flex', alignItems: 'flex-end' }}>
        <span>forv</span>
        <span style={{ fontStyle: 'italic', margin: '0 0.5px' }}>/</span>
        <span>s</span>
      </div>
      {/* mazars */}
      <div style={{ color: mazarsColor, fontSize, letterSpacing: '-0.03em', height: lineH, display: 'flex', alignItems: 'flex-end' }}>
        mazars
      </div>
    </div>
  );
}
