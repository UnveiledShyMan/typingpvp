// Page de la Politique de Confidentialité
export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-bg-primary py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-4">Politique de Confidentialité</h1>
          <p className="text-text-secondary text-sm">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        {/* Contenu */}
        <div className="bg-bg-secondary rounded-lg border border-border-secondary p-8 space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-text-secondary leading-relaxed mb-4">
              La présente Politique de Confidentialité décrit la manière dont typingpvp.com (ci-après "nous", "notre" ou "la Plateforme") 
              collecte, utilise, stocke et protège vos données personnelles lorsque vous utilisez notre service.
            </p>
            <p className="text-text-secondary leading-relaxed">
              En utilisant notre Plateforme, vous acceptez les pratiques décrites dans cette politique. Si vous n'acceptez pas 
              cette politique, veuillez ne pas utiliser notre service.
            </p>
          </section>

          {/* Section 1 - Données collectées */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">1. Données que nous collectons</h2>
            <div className="text-text-secondary leading-relaxed space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">1.1. Données fournies par l'utilisateur</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong className="text-text-primary">Informations de compte :</strong> nom d'utilisateur, adresse email, mot de passe (hashé)</li>
                  <li><strong className="text-text-primary">Profil :</strong> avatar, biographie, liens vers les réseaux sociaux (optionnel)</li>
                  <li><strong className="text-text-primary">Données de performance :</strong> résultats des matchs, statistiques de dactylographie (WPM, précision, ELO)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">1.2. Données collectées automatiquement</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong className="text-text-primary">Données de connexion :</strong> adresse IP, type de navigateur, système d'exploitation</li>
                  <li><strong className="text-text-primary">Cookies et technologies similaires :</strong> pour améliorer l'expérience utilisateur et analyser l'utilisation du site</li>
                  <li><strong className="text-text-primary">Données d'utilisation :</strong> pages visitées, temps passé, interactions avec le service</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 - Utilisation des données */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">2. Utilisation de vos données</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Nous utilisons vos données personnelles pour les finalités suivantes :
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
              <li>Fournir, maintenir et améliorer nos services</li>
              <li>Gérer votre compte utilisateur et vos préférences</li>
              <li>Calculer et afficher vos statistiques, classements et résultats</li>
              <li>Faciliter les interactions entre utilisateurs (matchs, compétitions, système d'amis)</li>
              <li>Vous informer des mises à jour importantes du service</li>
              <li>Détecter et prévenir la fraude, les abus et les activités illégales</li>
              <li>Analyser l'utilisation du service pour améliorer l'expérience utilisateur</li>
              <li>Respecter nos obligations légales</li>
            </ul>
          </section>

          {/* Section 3 - Partage des données */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">3. Partage de vos données</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Nous ne vendons pas vos données personnelles à des tiers. Nous pouvons partager vos données dans les cas suivants :
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
              <li><strong className="text-text-primary">Avec votre consentement :</strong> lorsque vous avez expressément autorisé le partage</li>
              <li><strong className="text-text-primary">Données publiques :</strong> votre nom d'utilisateur, avatar, statistiques et classements sont visibles par tous les utilisateurs</li>
              <li><strong className="text-text-primary">Prestataires de services :</strong> avec des fournisseurs de services tiers qui nous aident à exploiter la Plateforme (hébergement, analyse, etc.)</li>
              <li><strong className="text-text-primary">Obligations légales :</strong> si la loi l'exige ou en réponse à une demande légale valide</li>
            </ul>
          </section>

          {/* Section 4 - Sécurité */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">4. Sécurité de vos données</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos 
              données personnelles contre l'accès non autorisé, la perte, la destruction ou l'altération.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Cependant, aucune méthode de transmission sur Internet ou de stockage électronique n'est totalement sécurisée. 
              Bien que nous nous efforcions d'utiliser des moyens commercialement acceptables pour protéger vos données, 
              nous ne pouvons garantir une sécurité absolue.
            </p>
          </section>

          {/* Section 5 - Vos droits */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">5. Vos droits</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, 
              vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
              <li><strong className="text-text-primary">Droit d'accès :</strong> vous pouvez demander une copie de vos données personnelles</li>
              <li><strong className="text-text-primary">Droit de rectification :</strong> vous pouvez corriger vos données inexactes ou incomplètes</li>
              <li><strong className="text-text-primary">Droit à l'effacement :</strong> vous pouvez demander la suppression de vos données</li>
              <li><strong className="text-text-primary">Droit à la limitation du traitement :</strong> vous pouvez demander la limitation du traitement de vos données</li>
              <li><strong className="text-text-primary">Droit à la portabilité :</strong> vous pouvez recevoir vos données dans un format structuré</li>
              <li><strong className="text-text-primary">Droit d'opposition :</strong> vous pouvez vous opposer au traitement de vos données</li>
              <li><strong className="text-text-primary">Droit de retrait du consentement :</strong> lorsque le traitement est basé sur votre consentement</li>
            </ul>
            <p className="text-text-secondary leading-relaxed mt-4">
              Pour exercer ces droits, contactez-nous à l'adresse : 
              <a href="mailto:contact@typingpvp.com" className="text-accent-primary hover:text-accent-hover ml-1">
                contact@typingpvp.com
              </a>
            </p>
          </section>

          {/* Section 6 - Conservation */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">6. Conservation des données</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Nous conservons vos données personnelles aussi longtemps que nécessaire pour les finalités décrites dans cette 
              politique, sauf si une période de conservation plus longue est requise ou autorisée par la loi.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Lorsque vous supprimez votre compte, vos données sont généralement supprimées dans un délai de 30 jours, 
              sauf si nous sommes tenus de les conserver pour des raisons légales ou légitimes.
            </p>
          </section>

          {/* Section 7 - Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">7. Cookies</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Nous utilisons des cookies et des technologies similaires pour améliorer votre expérience, analyser l'utilisation 
              du site et personnaliser le contenu.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela peut affecter certaines fonctionnalités 
              de la Plateforme.
            </p>
          </section>

          {/* Section 8 - Modifications */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">8. Modifications de cette politique</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Nous pouvons modifier cette Politique de Confidentialité de temps à autre. Nous vous informerons de tout changement 
              important en publiant la nouvelle politique sur cette page et en mettant à jour la date de "dernière mise à jour".
            </p>
            <p className="text-text-secondary leading-relaxed">
              Nous vous encourageons à consulter régulièrement cette page pour prendre connaissance de notre politique de protection 
              de vos données.
            </p>
          </section>

          {/* Section 9 - Mineurs */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">9. Protection des mineurs</h2>
            <p className="text-text-secondary leading-relaxed">
              Notre service n'est pas destiné aux personnes de moins de 13 ans. Nous ne collectons pas sciemment de données 
              personnelles auprès d'enfants de moins de 13 ans. Si nous apprenons que nous avons collecté des données d'un enfant 
              de moins de 13 ans, nous prendrons des mesures pour supprimer ces informations.
            </p>
          </section>

          {/* Section Contact */}
          <section className="pt-8 border-t border-border-primary">
            <h2 className="text-2xl font-bold text-text-primary mb-4">Contact</h2>
            <p className="text-text-secondary leading-relaxed mb-2">
              Pour toute question concernant cette Politique de Confidentialité ou pour exercer vos droits, vous pouvez nous contacter à :
            </p>
            <p className="text-text-secondary">
              <a href="mailto:contact@typingpvp.com" className="text-accent-primary hover:text-accent-hover">
                contact@typingpvp.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

