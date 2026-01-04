export default function TrophyIcon({ className = "w-5 h-5", stroke = "currentColor" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M6 9H4C3.44772 9 3 9.44772 3 10V12C3 15.866 6.13401 19 10 19H14C17.866 19 21 15.866 21 12V10C21 9.44772 20.5523 9 20 9H18" 
        stroke={stroke} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M6 9V7C6 4.79086 7.79086 3 10 3H14C16.2091 3 18 4.79086 18 7V9" 
        stroke={stroke} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M12 19V22" 
        stroke={stroke} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M8 22H16" 
        stroke={stroke} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <circle 
        cx="12" 
        cy="12" 
        r="1" 
        fill={stroke}
        opacity="0.4"
      />
    </svg>
  )
}

