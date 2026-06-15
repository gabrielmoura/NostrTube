import type { SVGProps } from 'react'

interface NostrTubeLogoWithTextProps extends SVGProps<SVGSVGElement> {
  nostrTextColor?: string
  tubeTextColor?: string
  taglineColor?: string
}

export const NostrTubeLogoWhitText = ({
  nostrTextColor = 'currentColor',
  tubeTextColor = 'currentColor',
  taglineColor = nostrTextColor,
  ...props
}: NostrTubeLogoWithTextProps) => (
  <svg
    width={1600}
    height={420}
    viewBox="0 0 1600 420"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-labelledby="title desc"
    {...props}
  >
    <title id="title">{'NostrTube logo'}</title>
    <desc id="desc">{'Editable SVG logo for NostrTube with neon network play icon and configurable text colors.'}</desc>
    <defs>
      <linearGradient id="iconGradient" x1={40} y1={340} x2={340} y2={80} gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#C95BFF" />
        <stop offset="50%" stopColor="#7C4DFF" />
        <stop offset="100%" stopColor="#19D5FF" />
      </linearGradient>
      <linearGradient id="playGradient" x1={118} y1={294} x2={265} y2={155} gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#D86BFF" />
        <stop offset="100%" stopColor="#18CFFF" />
      </linearGradient>
      <linearGradient id="boltGradient" x1={146} y1={374} x2={202} y2={274} gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFD54A" />
        <stop offset="100%" stopColor="#FF9F0A" />
      </linearGradient>
      <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={10} result="blur" />
        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.55 0" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="boltGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={8} result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="1 0 0 0 0.95  0 1 0 0 0.55  0 0 1 0 0.05  0 0 0 0.7 0"
          result="glow"
        />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <style />
    </defs>
    <g transform="translate(10 10)">
      <g filter="url(#softGlow)">
        <polygon
          points="115,325 50,285 50,145 170,70 290,145 290,285 225,325"
          stroke="url(#iconGradient)"
          strokeWidth={16}
          strokeLinejoin="round"
        />
        <line x1={50} y1={145} x2={115} y2={105} stroke="url(#iconGradient)" strokeWidth={10} opacity={0.28} />
        <line x1={50} y1={285} x2={115} y2={325} stroke="url(#iconGradient)" strokeWidth={10} opacity={0.28} />
        <line x1={170} y1={70} x2={170} y2={140} stroke="url(#iconGradient)" strokeWidth={10} opacity={0.28} />
        <line x1={290} y1={145} x2={225} y2={185} stroke="url(#iconGradient)" strokeWidth={10} opacity={0.28} />
        <line x1={290} y1={285} x2={225} y2={325} stroke="url(#iconGradient)" strokeWidth={10} opacity={0.28} />
        <circle cx={50} cy={145} r={18} fill="#0B1020" stroke="url(#iconGradient)" strokeWidth={14} />
        <circle cx={170} cy={70} r={18} fill="#0B1020" stroke="url(#iconGradient)" strokeWidth={14} />
        <circle cx={290} cy={145} r={18} fill="#0B1020" stroke="url(#iconGradient)" strokeWidth={14} />
        <circle cx={290} cy={285} r={18} fill="#0B1020" stroke="url(#iconGradient)" strokeWidth={14} />
        <circle cx={50} cy={285} r={18} fill="#0B1020" stroke="url(#iconGradient)" strokeWidth={14} />
        <path
          d="M130 178C130 160 149 149 165 158L225 192C241 201 241 224 225 233L165 267C149 276 130 265 130 247V178Z"
          stroke="url(#playGradient)"
          strokeWidth={18}
          strokeLinejoin="round"
        />
      </g>
      <g filter="url(#boltGlow)">
        <path
          d="M150 346L200 287L177 287L198 238L136 310H162L150 346Z"
          fill="none"
          stroke="url(#boltGradient)"
          strokeWidth={12}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>
      <g transform="translate(410 0)">
        <text x={0} y={250} className="wordmark" fontSize={170} fill={nostrTextColor}>
          {'Nostr'}
        </text>
        <text x={620} y={250} className="wordmark" fontSize={170} fill={tubeTextColor}>
          {'Tube'}
        </text>
        <text x={0} y={315} className="tagline" fontSize={34} opacity={0.72} fill={taglineColor}>
          {'Decentralized video powered by Nostr'}
        </text>
      </g>
    </g>
  </svg>
)

export const NostrTubeLogo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width={360}
    height={360}
    viewBox="0 0 360 360"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-labelledby="title desc"
    {...props}
  >
    <title id="title">{'NostrTube icon logo'}</title>
    <desc id="desc">
      {'Editable SVG icon-only logo for NostrTube with neon network play icon and lightning accent.'}
    </desc>
    <defs>
      <linearGradient id="iconGradient" x1={40} y1={300} x2={320} y2={60} gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#C95BFF" />
        <stop offset="50%" stopColor="#7C4DFF" />
        <stop offset="100%" stopColor="#19D5FF" />
      </linearGradient>
      <linearGradient id="playGradient" x1={112} y1={258} x2={248} y2={128} gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#D86BFF" />
        <stop offset="100%" stopColor="#18CFFF" />
      </linearGradient>
      <linearGradient id="boltGradient" x1={140} y1={334} x2={194} y2={244} gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFD54A" />
        <stop offset="100%" stopColor="#FF9F0A" />
      </linearGradient>
      <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={10} result="blur" />
        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.55 0" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="boltGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={8} result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="1 0 0 0 0.95  0 1 0 0 0.55  0 0 1 0 0.05  0 0 0 0.7 0"
          result="glow"
        />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g transform="translate(10 10)">
      <g filter="url(#softGlow)">
        <polygon
          points="110,310 50,272 50,138 160,70 270,138 270,272 210,310"
          stroke="url(#iconGradient)"
          strokeWidth={16}
          strokeLinejoin="round"
        />
        <line x1={50} y1={138} x2={110} y2={100} stroke="url(#iconGradient)" strokeWidth={10} opacity={0.28} />
        <line x1={50} y1={272} x2={110} y2={310} stroke="url(#iconGradient)" strokeWidth={10} opacity={0.28} />
        <line x1={160} y1={70} x2={160} y2={138} stroke="url(#iconGradient)" strokeWidth={10} opacity={0.28} />
        <line x1={270} y1={138} x2={210} y2={176} stroke="url(#iconGradient)" strokeWidth={10} opacity={0.28} />
        <line x1={270} y1={272} x2={210} y2={310} stroke="url(#iconGradient)" strokeWidth={10} opacity={0.28} />
        <circle cx={50} cy={138} r={18} fill="#0B1020" stroke="url(#iconGradient)" strokeWidth={14} />
        <circle cx={160} cy={70} r={18} fill="#0B1020" stroke="url(#iconGradient)" strokeWidth={14} />
        <circle cx={270} cy={138} r={18} fill="#0B1020" stroke="url(#iconGradient)" strokeWidth={14} />
        <circle cx={270} cy={272} r={18} fill="#0B1020" stroke="url(#iconGradient)" strokeWidth={14} />
        <circle cx={50} cy={272} r={18} fill="#0B1020" stroke="url(#iconGradient)" strokeWidth={14} />
        <path
          d="M122 168C122 151 139 140 154 149L208 181C223 190 223 211 208 220L154 252C139 261 122 250 122 233V168Z"
          stroke="url(#playGradient)"
          strokeWidth={18}
          strokeLinejoin="round"
        />
      </g>
      <g filter="url(#boltGlow)">
        <path
          d="M145 332L193 277L171 277L191 232L133 299H157L145 332Z"
          fill="none"
          stroke="url(#boltGradient)"
          strokeWidth={12}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>
    </g>
  </svg>
)
