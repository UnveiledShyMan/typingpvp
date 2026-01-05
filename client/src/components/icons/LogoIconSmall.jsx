// Variante petite du logo pour utiliser comme placeholder d'avatar
// Deux claviers qui se croisent vraiment (en forme de X) - version compacte
export default function LogoIconSmall({ className = "w-8 h-8", stroke = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Clavier de gauche (incliné vers la droite, se croise avec l'autre) */}
      <g transform="rotate(-45 16 16)">
        {/* Forme principale du clavier */}
        <rect
          x="8"
          y="6"
          width="5"
          height="13"
          rx="0.8"
          fill="none"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Touches - Colonne de gauche */}
        <rect x="9" y="8" width="1" height="2" rx="0.2" fill={stroke} opacity="0.7" />
        <rect x="9" y="11" width="1" height="2" rx="0.2" fill={stroke} opacity="0.7" />
        <rect x="9" y="14" width="1" height="2" rx="0.2" fill={stroke} opacity="0.7" />
        {/* Touches - Colonne du milieu */}
        <rect x="11" y="8" width="1" height="2" rx="0.2" fill={stroke} opacity="0.9" />
        <rect x="11" y="11" width="1" height="2" rx="0.2" fill={stroke} opacity="0.9" />
        <rect x="11" y="14" width="1" height="2" rx="0.2" fill={stroke} opacity="0.9" />
        {/* Touches - Colonne de droite */}
        <rect x="13" y="8" width="1" height="2" rx="0.2" fill={stroke} opacity="0.7" />
        <rect x="13" y="11" width="1" height="2" rx="0.2" fill={stroke} opacity="0.7" />
        <rect x="13" y="14" width="1" height="2" rx="0.2" fill={stroke} opacity="0.7" />
      </g>

      {/* Clavier de droite (incliné vers la gauche, se croise avec l'autre) */}
      <g transform="rotate(45 16 16)">
        {/* Forme principale du clavier */}
        <rect
          x="19"
          y="6"
          width="5"
          height="13"
          rx="0.8"
          fill="none"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Touches - Colonne de gauche */}
        <rect x="20" y="8" width="1" height="2" rx="0.2" fill={stroke} opacity="0.7" />
        <rect x="20" y="11" width="1" height="2" rx="0.2" fill={stroke} opacity="0.7" />
        <rect x="20" y="14" width="1" height="2" rx="0.2" fill={stroke} opacity="0.7" />
        {/* Touches - Colonne du milieu */}
        <rect x="22" y="8" width="1" height="2" rx="0.2" fill={stroke} opacity="0.9" />
        <rect x="22" y="11" width="1" height="2" rx="0.2" fill={stroke} opacity="0.9" />
        <rect x="22" y="14" width="1" height="2" rx="0.2" fill={stroke} opacity="0.9" />
        {/* Touches - Colonne de droite */}
        <rect x="24" y="8" width="1" height="2" rx="0.2" fill={stroke} opacity="0.7" />
        <rect x="24" y="11" width="1" height="2" rx="0.2" fill={stroke} opacity="0.7" />
        <rect x="24" y="14" width="1" height="2" rx="0.2" fill={stroke} opacity="0.7" />
      </g>
    </svg>
  );
}

