// Icône pour le mode "words" (mots)
export default function WordsIcon({ className = "w-4 h-4", stroke = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Lignes de texte représentant des mots */}
      <path
        d="M4 8H20M4 12H16M4 16H20"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Points représentant des lettres */}
      <circle cx="6" cy="8" r="0.5" fill={stroke} opacity="0.6" />
      <circle cx="6" cy="12" r="0.5" fill={stroke} opacity="0.6" />
      <circle cx="6" cy="16" r="0.5" fill={stroke} opacity="0.6" />
    </svg>
  );
}

