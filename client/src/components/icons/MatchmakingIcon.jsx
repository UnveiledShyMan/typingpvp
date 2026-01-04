export default function MatchmakingIcon({ className = "w-5 h-5", stroke = "currentColor" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle 
        cx="12" 
        cy="12" 
        r="3" 
        stroke={stroke} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M12 1V3M12 21V23M1 12H3M21 12H23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" 
        stroke={stroke} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        opacity="0.6"
      />
      <circle 
        cx="12" 
        cy="12" 
        r="1" 
        fill={stroke}
        opacity="0.8"
      />
    </svg>
  )
}

