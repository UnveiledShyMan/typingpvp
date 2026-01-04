// Variante petite du logo pour utiliser comme placeholder d'avatar
// Deux claviers qui se croisent comme des épées pointant vers le haut - version compacte
export default function LogoIconSmall({ className = "w-8 h-8", stroke = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Clavier de gauche (incliné vers la droite, pointe vers le haut) */}
      <g transform="rotate(-25 16 16)">
        {/* Forme principale du clavier - orienté verticalement */}
        <rect
          x="10"
          y="5"
          width="6"
          height="16"
          rx="0.8"
          fill="none"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Touches simplifiées - colonne de gauche */}
        <rect x="11.5" y="7" width="1.5" height="2" rx="0.2" fill={stroke} opacity="0.7" />
        <rect x="11.5" y="10" width="1.5" height="2" rx="0.2" fill={stroke} opacity="0.7" />
        <rect x="11.5" y="13" width="1.5" height="2" rx="0.2" fill={stroke} opacity="0.7" />
        {/* Touches simplifiées - colonne du milieu */}
        <rect x="14" y="7" width="1.5" height="2" rx="0.2" fill={stroke} opacity="0.9" />
        <rect x="14" y="10" width="1.5" height="2" rx="0.2" fill={stroke} opacity="0.9" />
        <rect x="14" y="13" width="1.5" height="2" rx="0.2" fill={stroke} opacity="0.9" />
        {/* Touches simplifiées - colonne de droite */}
        <rect x="16.5" y="7" width="1.5" height="2" rx="0.2" fill={stroke} opacity="0.7" />
        <rect x="16.5" y="10" width="1.5" height="2" rx="0.2" fill={stroke} opacity="0.7" />
        <rect x="16.5" y="13" width="1.5" height="2" rx="0.2" fill={stroke} opacity="0.7" />
      </g>

      {/* Clavier de droite (incliné vers la gauche, pointe vers le haut) */}
      <g transform="rotate(25 16 16)">
        {/* Forme principale du clavier - orienté verticalement */}
        <rect
          x="10"
          y="5"
          width="6"
          height="16"
          rx="0.8"
          fill="none"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Touches simplifiées - colonne de gauche */}
        <rect x="11.5" y="7" width="1.5" height="2" rx="0.2" fill={stroke} opacity="0.7" />
        <rect x="11.5" y="10" width="1.5" height="2" rx="0.2" fill={stroke} opacity="0.7" />
        <rect x="11.5" y="13" width="1.5" height="2" rx="0.2" fill={stroke} opacity="0.7" />
        {/* Touches simplifiées - colonne du milieu */}
        <rect x="14" y="7" width="1.5" height="2" rx="0.2" fill={stroke} opacity="0.9" />
        <rect x="14" y="10" width="1.5" height="2" rx="0.2" fill={stroke} opacity="0.9" />
        <rect x="14" y="13" width="1.5" height="2" rx="0.2" fill={stroke} opacity="0.9" />
        {/* Touches simplifiées - colonne de droite */}
        <rect x="16.5" y="7" width="1.5" height="2" rx="0.2" fill={stroke} opacity="0.7" />
        <rect x="16.5" y="10" width="1.5" height="2" rx="0.2" fill={stroke} opacity="0.7" />
        <rect x="16.5" y="13" width="1.5" height="2" rx="0.2" fill={stroke} opacity="0.7" />
      </g>
    </svg>
  );
}

