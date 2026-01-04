export default function SwordIcon({ className = "w-5 h-5", stroke = "currentColor" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M6 2L4 4L10 10L8 12L12 16L14 14L20 20L22 18L16 12L18 10L10 2L6 2Z" 
        stroke={stroke} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      <path 
        d="M2 6L4 4L10 10L8 12" 
        stroke={stroke} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  )
}

