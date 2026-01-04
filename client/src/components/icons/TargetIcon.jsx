export default function TargetIcon({ className = "w-5 h-5", stroke = "currentColor" }) {
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
        r="10" 
        stroke={stroke} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <circle 
        cx="12" 
        cy="12" 
        r="6" 
        stroke={stroke} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        opacity="0.7"
      />
      <circle 
        cx="12" 
        cy="12" 
        r="2" 
        fill={stroke}
        opacity="0.8"
      />
      <path 
        d="M12 2V6M12 18V22M2 12H6M18 12H22" 
        stroke={stroke} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        opacity="0.5"
      />
    </svg>
  )
}

