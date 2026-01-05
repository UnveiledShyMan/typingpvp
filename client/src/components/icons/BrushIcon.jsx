// Icône pinceau stylisée pour le sélecteur de thème
export default function BrushIcon({ className = "w-5 h-5", stroke = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Manche du pinceau */}
      <rect
        x="7"
        y="2"
        width="2"
        height="8"
        rx="1"
        fill={stroke}
        opacity="0.8"
      />
      {/* Ferrule (virole métallique) */}
      <rect
        x="6.5"
        y="10"
        width="3"
        height="1.5"
        rx="0.5"
        fill={stroke}
        opacity="0.6"
      />
      {/* Poils du pinceau - forme arrondie */}
      <path
        d="M6 11.5C6 11.5 5.5 12 5.5 13C5.5 14 6 15 6 16C6 17 6.5 18 7 18.5C7.5 19 8 19 8.5 19C9 19 9.5 19 10 18.5C10.5 18 11 17 11 16C11 15 11.5 14 11.5 13C11.5 12 11 11.5 11 11.5"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Détails des poils */}
      <path
        d="M6.5 13L7 14L7.5 15L8 16L8.5 17"
        stroke={stroke}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M9.5 13L9 14L8.5 15L8 16L7.5 17"
        stroke={stroke}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Pointe du pinceau avec peinture */}
      <path
        d="M6.5 18C6.5 18 7 19 8 19.5C9 20 10 20 10 20"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Gouttelette de peinture */}
      <circle
        cx="10"
        cy="20"
        r="1.5"
        fill={stroke}
        opacity="0.9"
      />
      {/* Trait de peinture */}
      <path
        d="M10 20L18 20"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

