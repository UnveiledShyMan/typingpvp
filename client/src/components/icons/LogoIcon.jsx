// Logo : Deux claviers qui se croisent vraiment (en forme de X)
export default function LogoIcon({ className = "w-10 h-10", stroke = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Clavier de gauche (incliné vers la droite, se croise avec l'autre) */}
      <g transform="rotate(-45 50 50)">
        {/* Forme principale du clavier */}
        <rect
          x="25"
          y="20"
          width="15"
          height="40"
          rx="2"
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Touches - Colonne de gauche */}
        <rect x="27" y="24" width="3" height="5" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="27" y="31" width="3" height="5" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="27" y="38" width="3" height="5" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="27" y="45" width="3" height="5" rx="0.5" fill={stroke} opacity="0.7" />
        {/* Touches - Colonne du milieu */}
        <rect x="32" y="24" width="3" height="5" rx="0.5" fill={stroke} opacity="0.9" />
        <rect x="32" y="31" width="3" height="5" rx="0.5" fill={stroke} opacity="0.9" />
        <rect x="32" y="38" width="3" height="5" rx="0.5" fill={stroke} opacity="0.9" />
        <rect x="32" y="45" width="3" height="5" rx="0.5" fill={stroke} opacity="0.9" />
        {/* Touches - Colonne de droite */}
        <rect x="37" y="24" width="3" height="5" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="37" y="31" width="3" height="5" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="37" y="38" width="3" height="5" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="37" y="45" width="3" height="5" rx="0.5" fill={stroke} opacity="0.7" />
      </g>

      {/* Clavier de droite (incliné vers la gauche, se croise avec l'autre) */}
      <g transform="rotate(45 50 50)">
        {/* Forme principale du clavier */}
        <rect
          x="60"
          y="20"
          width="15"
          height="40"
          rx="2"
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Touches - Colonne de gauche */}
        <rect x="62" y="24" width="3" height="5" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="62" y="31" width="3" height="5" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="62" y="38" width="3" height="5" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="62" y="45" width="3" height="5" rx="0.5" fill={stroke} opacity="0.7" />
        {/* Touches - Colonne du milieu */}
        <rect x="67" y="24" width="3" height="5" rx="0.5" fill={stroke} opacity="0.9" />
        <rect x="67" y="31" width="3" height="5" rx="0.5" fill={stroke} opacity="0.9" />
        <rect x="67" y="38" width="3" height="5" rx="0.5" fill={stroke} opacity="0.9" />
        <rect x="67" y="45" width="3" height="5" rx="0.5" fill={stroke} opacity="0.9" />
        {/* Touches - Colonne de droite */}
        <rect x="72" y="24" width="3" height="5" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="72" y="31" width="3" height="5" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="72" y="38" width="3" height="5" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="72" y="45" width="3" height="5" rx="0.5" fill={stroke} opacity="0.7" />
      </g>
    </svg>
  );
}

