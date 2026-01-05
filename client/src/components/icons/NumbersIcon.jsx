// Icône pour le mode "numbers" (nombres)
export default function NumbersIcon({ className = "w-4 h-4", stroke = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Chiffres stylisés */}
      <path
        d="M6 4L6 20M10 4L10 20M14 4L14 20M18 4L18 20"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      {/* Barres horizontales pour représenter des chiffres */}
      <path
        d="M6 6L10 6M6 10L10 10M6 14L10 14M6 18L10 18M14 6L18 6M14 10L18 10M14 14L18 14M14 18L18 18"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

