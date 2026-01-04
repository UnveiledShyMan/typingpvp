export default function KeyboardIcon({ className = "w-5 h-5", stroke = "currentColor" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect 
        x="3" 
        y="6" 
        width="18" 
        height="12" 
        rx="2" 
        stroke={stroke} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M7 10H9M11 10H13M15 10H17M7 14H17" 
        stroke={stroke} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <circle 
        cx="5" 
        cy="10" 
        r="0.5" 
        fill={stroke}
        opacity="0.6"
      />
      <circle 
        cx="19" 
        cy="10" 
        r="0.5" 
        fill={stroke}
        opacity="0.6"
      />
    </svg>
  )
}

