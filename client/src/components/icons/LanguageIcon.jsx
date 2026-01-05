// Icône pour le sélecteur de langue
export default function LanguageIcon({ className = "w-4 h-4", stroke = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Globe terrestre */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Lignes de latitude */}
      <path
        d="M3 12H21M12 3C12 3 15 6 15 12C15 18 12 21 12 21M12 3C12 3 9 6 9 12C9 18 12 21 12 21"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
      {/* Point central */}
      <circle
        cx="12"
        cy="12"
        r="1.5"
        fill={stroke}
        opacity="0.8"
      />
    </svg>
  );
}

