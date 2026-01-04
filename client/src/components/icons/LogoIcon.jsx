// Logo : Deux claviers qui se croisent comme des épées pointant vers le haut
export default function LogoIcon({ className = "w-10 h-10", stroke = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Clavier de gauche (incliné vers la droite, pointe vers le haut) */}
      <g transform="rotate(-25 50 50)">
        {/* Forme principale du clavier - orienté verticalement */}
        <rect
          x="30"
          y="15"
          width="20"
          height="50"
          rx="2"
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Touches simplifiées - colonne de gauche */}
        <rect x="33" y="20" width="4" height="6" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="33" y="29" width="4" height="6" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="33" y="38" width="4" height="6" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="33" y="47" width="4" height="6" rx="0.5" fill={stroke} opacity="0.7" />
        {/* Touches simplifiées - colonne du milieu */}
        <rect x="40" y="20" width="4" height="6" rx="0.5" fill={stroke} opacity="0.9" />
        <rect x="40" y="29" width="4" height="6" rx="0.5" fill={stroke} opacity="0.9" />
        <rect x="40" y="38" width="4" height="6" rx="0.5" fill={stroke} opacity="0.9" />
        <rect x="40" y="47" width="4" height="6" rx="0.5" fill={stroke} opacity="0.9" />
        {/* Touches simplifiées - colonne de droite */}
        <rect x="47" y="20" width="4" height="6" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="47" y="29" width="4" height="6" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="47" y="38" width="4" height="6" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="47" y="47" width="4" height="6" rx="0.5" fill={stroke} opacity="0.7" />
      </g>

      {/* Clavier de droite (incliné vers la gauche, pointe vers le haut) */}
      <g transform="rotate(25 50 50)">
        {/* Forme principale du clavier - orienté verticalement */}
        <rect
          x="30"
          y="15"
          width="20"
          height="50"
          rx="2"
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Touches simplifiées - colonne de gauche */}
        <rect x="33" y="20" width="4" height="6" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="33" y="29" width="4" height="6" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="33" y="38" width="4" height="6" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="33" y="47" width="4" height="6" rx="0.5" fill={stroke} opacity="0.7" />
        {/* Touches simplifiées - colonne du milieu */}
        <rect x="40" y="20" width="4" height="6" rx="0.5" fill={stroke} opacity="0.9" />
        <rect x="40" y="29" width="4" height="6" rx="0.5" fill={stroke} opacity="0.9" />
        <rect x="40" y="38" width="4" height="6" rx="0.5" fill={stroke} opacity="0.9" />
        <rect x="40" y="47" width="4" height="6" rx="0.5" fill={stroke} opacity="0.9" />
        {/* Touches simplifiées - colonne de droite */}
        <rect x="47" y="20" width="4" height="6" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="47" y="29" width="4" height="6" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="47" y="38" width="4" height="6" rx="0.5" fill={stroke} opacity="0.7" />
        <rect x="47" y="47" width="4" height="6" rx="0.5" fill={stroke} opacity="0.7" />
      </g>
    </svg>
  );
}

