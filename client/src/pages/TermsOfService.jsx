// Page des Conditions Générales d'Utilisation (CGU)
export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-bg-primary py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-4">Conditions Générales d'Utilisation</h1>
          <p className="text-text-secondary text-sm">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        {/* Contenu */}
        <div className="bg-bg-secondary rounded-lg border border-border-secondary p-8 space-y-8">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">1. Objet</h2>
            <p className="text-text-secondary leading-relaxed">
              Les présentes Conditions Générales d'Utilisation (ci-après "CGU") ont pour objet de définir les conditions 
              et modalités d'utilisation de la plateforme typingpvp.com (ci-après "la Plateforme") ainsi que les droits 
              et obligations des parties dans ce cadre.
            </p>
            <p className="text-text-secondary leading-relaxed mt-4">
              La Plateforme est un service de compétition de dactylographie en ligne permettant aux utilisateurs de 
              participer à des matchs, compétitions et classements.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">2. Acceptation des CGU</h2>
            <p className="text-text-secondary leading-relaxed">
              L'accès et l'utilisation de la Plateforme impliquent l'acceptation pleine et entière des présentes CGU. 
              En cas de non-acceptation de ces conditions, l'utilisateur doit renoncer à l'accès aux services proposés 
              par la Plateforme.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">3. Inscription et compte utilisateur</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Pour accéder à certaines fonctionnalités de la Plateforme, l'utilisateur doit créer un compte en 
              fournissant des informations exactes, complètes et à jour.
            </p>
            <p className="text-text-secondary leading-relaxed mb-4">
              L'utilisateur est responsable de la confidentialité de ses identifiants de connexion et s'engage à ne 
              pas les communiquer à des tiers.
            </p>
            <p className="text-text-secondary leading-relaxed">
              La Plateforme se réserve le droit de suspendre ou supprimer tout compte en cas de violation des présentes CGU.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">4. Utilisation de la Plateforme</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              L'utilisateur s'engage à utiliser la Plateforme conformément à sa destination et de manière loyale. 
              Il est strictement interdit de :
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
              <li>Utiliser des logiciels ou scripts automatisés pour tricher lors des compétitions</li>
              <li>Tenter de manipuler le système de classement ou les résultats</li>
              <li>Utiliser un nom d'utilisateur offensant, diffamatoire ou portant atteinte aux droits de tiers</li>
              <li>Harceler, intimider ou nuire à d'autres utilisateurs</li>
              <li>Partager du contenu illicite, discriminatoire ou violent</li>
              <li>Vendre, louer ou transférer son compte à un tiers</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">5. Propriété intellectuelle</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              La Plateforme et l'ensemble de son contenu (textes, images, logos, designs, code source) sont protégés 
              par le droit de la propriété intellectuelle et appartiennent à la Plateforme ou à ses partenaires.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Toute reproduction, représentation, modification ou adaptation sans autorisation préalable est interdite.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">6. Responsabilité</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              La Plateforme s'efforce d'assurer un service de qualité, mais ne peut garantir un fonctionnement 
              continu et sans erreur du service.
            </p>
            <p className="text-text-secondary leading-relaxed mb-4">
              La Plateforme ne saurait être tenue responsable des dommages directs ou indirects résultant de 
              l'utilisation ou de l'impossibilité d'utiliser la Plateforme.
            </p>
            <p className="text-text-secondary leading-relaxed">
              L'utilisateur est seul responsable de l'utilisation qu'il fait de la Plateforme et des conséquences 
              qui en découlent.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">7. Données personnelles</h2>
            <p className="text-text-secondary leading-relaxed">
              La collecte et le traitement des données personnelles sont décrits dans notre Politique de Confidentialité, 
              accessible depuis la Plateforme.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">8. Modification des CGU</h2>
            <p className="text-text-secondary leading-relaxed">
              La Plateforme se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront 
              informés des modifications importantes. La poursuite de l'utilisation de la Plateforme après modification 
              vaut acceptation des nouvelles conditions.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">9. Résiliation</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              L'utilisateur peut résilier son compte à tout moment en contactant le support.
            </p>
            <p className="text-text-secondary leading-relaxed">
              La Plateforme se réserve le droit de suspendre ou résilier un compte en cas de violation des présentes CGU, 
              sans préavis ni remboursement.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">10. Droit applicable et juridiction</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Les présentes CGU sont régies par le droit français.
            </p>
            <p className="text-text-secondary leading-relaxed">
              En cas de litige, et après tentative de résolution amiable, les tribunaux français seront seuls compétents.
            </p>
          </section>

          {/* Section Contact */}
          <section className="pt-8 border-t border-border-primary">
            <h2 className="text-2xl font-bold text-text-primary mb-4">Contact</h2>
            <p className="text-text-secondary leading-relaxed">
              Pour toute question relative aux présentes CGU, vous pouvez nous contacter à l'adresse email : 
              <a href="mailto:contact@typingpvp.com" className="text-accent-primary hover:text-accent-hover ml-1">
                contact@typingpvp.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

