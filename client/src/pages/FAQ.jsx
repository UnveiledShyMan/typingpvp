/**
 * Page FAQ pour le SEO - Schéma FAQPage
 * Améliore le référencement avec des rich snippets
 */

import SEOHead from '../components/SEOHead'

const faqData = [
  {
    question: "Qu'est-ce que TypingPVP ?",
    answer: "TypingPVP est une plateforme de compétition de dactylographie en temps réel. Testez votre vitesse de frappe, affrontez d'autres joueurs en 1v1, participez à des compétitions et montez dans les classements mondiaux."
  },
  {
    question: "Comment fonctionne le système ELO ?",
    answer: "Le système ELO mesure votre niveau de compétence. Gagnez des matchs pour augmenter votre ELO, perdez pour le diminuer. Plus votre ELO est élevé, plus vous affrontez des joueurs de haut niveau."
  },
  {
    question: "Puis-je jouer sans créer de compte ?",
    answer: "Oui, vous pouvez jouer en mode invité pour tester le jeu. Cependant, vos statistiques ne seront pas sauvegardées. Créez un compte gratuit pour sauvegarder votre progression et participer aux classements."
  },
  {
    question: "Comment améliorer ma vitesse de frappe ?",
    answer: "Pratiquez régulièrement avec le mode Solo, participez à des matchs 1v1 pour vous challenger, et analysez vos statistiques pour identifier vos points faibles. La régularité est la clé de l'amélioration."
  },
  {
    question: "Quelles langues sont supportées ?",
    answer: "TypingPVP supporte actuellement 10 langues : Anglais, Français, Espagnol, Allemand, Italien, Portugais, Russe, Japonais, Chinois et Coréen. Chaque langue a son propre classement ELO."
  },
  {
    question: "Comment fonctionne le matchmaking ?",
    answer: "Le matchmaking trouve automatiquement un adversaire avec un ELO similaire (±200 points). Vous pouvez choisir entre des matchs classés (affectent votre ELO) ou non classés (pour s'entraîner)."
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer: "Oui, nous prenons la sécurité de vos données très au sérieux. Toutes les communications sont chiffrées (HTTPS), et nous ne partageons jamais vos informations personnelles avec des tiers."
  },
  {
    question: "Puis-je jouer sur mobile ?",
    answer: "TypingPVP est optimisé pour les ordinateurs de bureau et tablettes. Pour une expérience optimale, nous recommandons l'utilisation d'un clavier physique."
  }
];

// Générer le schéma JSON-LD FAQPage
const generateFAQSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
};

export default function FAQ() {
  return (
    <>
      <SEOHead
        title="FAQ - TypingPVP"
        description="Questions fréquentes sur TypingPVP - Découvrez comment jouer, améliorer votre vitesse de frappe et monter dans les classements."
        keywords="FAQ, questions fréquentes, aide, typing battle, comment jouer, améliorer vitesse frappe"
        url="https://typingpvp.com/faq"
        type="FAQPage"
        jsonLd={generateFAQSchema()}
      />
      <div className="h-full w-full flex flex-col overflow-hidden p-4 sm:p-6">
        <div className="mb-6 flex-shrink-0">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>
            Questions Fréquentes
          </h1>
          <p className="text-text-secondary text-sm">
            Trouvez les réponses aux questions les plus courantes
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto profile-scroll">
          <div className="space-y-4 pb-4">
            {faqData.map((faq, index) => (
              <div
                key={index}
                className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-6 border border-border-secondary/40"
              >
                <h2 className="text-xl font-semibold text-text-primary mb-3">
                  {faq.question}
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

