// Icône de police/typographie pour le sélecteur de police
export default function FontIcon({ className = "w-5 h-5", stroke = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Lettre A majuscule */}
      <path
        d="M12 4L6 20M12 4L18 20M12 4L9 14M12 4L15 14"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Ligne de base */}
      <path
        d="M4 20L20 20"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

