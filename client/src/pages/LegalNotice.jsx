// Page des Mentions Légales
export default function LegalNotice() {
  return (
    <div className="min-h-screen bg-bg-primary py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-4">Mentions Légales</h1>
          <p className="text-text-secondary text-sm">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        {/* Contenu */}
        <div className="bg-bg-secondary rounded-lg border border-border-secondary p-8 space-y-8">
          {/* Section 1 - Éditeur */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">1. Éditeur du site</h2>
            <div className="text-text-secondary leading-relaxed space-y-2">
              <p>
                <strong className="text-text-primary">Nom du site :</strong> typingpvp.com
              </p>
              <p>
                <strong className="text-text-primary">Statut :</strong> Site web éducatif et de divertissement
              </p>
              <p>
                <strong className="text-text-primary">Directeur de publication :</strong> [À compléter]
              </p>
              <p>
                <strong className="text-text-primary">Contact :</strong>{' '}
                <a href="mailto:contact@typingpvp.com" className="text-accent-primary hover:text-accent-hover">
                  contact@typingpvp.com
                </a>
              </p>
            </div>
          </section>

          {/* Section 2 - Hébergement */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">2. Hébergement</h2>
            <div className="text-text-secondary leading-relaxed space-y-2">
              <p>
                Le site typingpvp.com est hébergé par : [À compléter avec les informations de l'hébergeur]
              </p>
              <p>
                <strong className="text-text-primary">Adresse :</strong> [À compléter]
              </p>
              <p>
                <strong className="text-text-primary">Téléphone :</strong> [À compléter]
              </p>
            </div>
          </section>

          {/* Section 3 - Propriété intellectuelle */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">3. Propriété intellectuelle</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              L'ensemble du contenu présent sur le site typingpvp.com (textes, images, vidéos, logos, icônes, 
              graphismes, design, code source) est la propriété exclusive de typingpvp.com ou de ses partenaires, 
              sauf mention contraire.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments 
              du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable.
            </p>
          </section>

          {/* Section 4 - Limitation de responsabilité */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">4. Limitation de responsabilité</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              typingpvp.com ne pourra être tenu responsable des dommages directs et indirects causés au matériel de 
              l'utilisateur lors de l'accès au site.
            </p>
            <p className="text-text-secondary leading-relaxed mb-4">
              typingpvp.com s'engage à sécuriser au mieux le site, cependant sa responsabilité ne pourra être mise en 
              cause si des données indésirables sont importées et installées sur son site à son insu.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Des espaces interactifs (commentaires, forums) sont à la disposition des utilisateurs. typingpvp.com se 
              réserve le droit de supprimer, sans mise en demeure préalable, tout contenu déposé dans cet espace qui 
              contreviendrait à la législation applicable en France, en particulier aux dispositions relatives à la 
              protection des données.
            </p>
          </section>

          {/* Section 5 - Liens hypertextes */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">5. Liens hypertextes</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Le site typingpvp.com peut contenir des liens hypertextes vers d'autres sites présents sur le réseau Internet.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Les liens vers ces autres ressources vous font quitter le site typingpvp.com. Il est possible de créer un 
              lien vers la page de présentation de ce site sans autorisation expresse de l'éditeur. Aucune autorisation 
              ni demande d'information préalable ne peut être exigée par l'éditeur à l'égard d'un site qui souhaite établir 
              un lien vers le site de l'éditeur.
            </p>
          </section>

          {/* Section 6 - Données personnelles */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">6. Données personnelles</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Conformément aux dispositions de la loi n° 78-17 du 6 janvier 1978 modifiée relative à l'informatique, 
              aux fichiers et aux libertés et du Règlement Général sur la Protection des Données (RGPD), vous disposez 
              des droits d'accès, de rectification, de suppression et d'opposition de vos données personnelles.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Pour plus d'informations sur le traitement de vos données personnelles, veuillez consulter notre 
              <a href="/privacy" className="text-accent-primary hover:text-accent-hover ml-1">
                Politique de Confidentialité
              </a>.
            </p>
          </section>

          {/* Section 7 - Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">7. Cookies</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Le site typingpvp.com peut être amené à vous demander l'acceptation des cookies pour des besoins de 
              statistiques et d'affichage.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Un cookie est une information déposée sur votre disque dur par le serveur du site que vous visitez. 
              Il contient plusieurs données qui sont stockées sur votre ordinateur dans un simple fichier texte auquel 
              un serveur accède pour lire et enregistrer des informations.
            </p>
          </section>

          {/* Section 8 - Droit applicable */}
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">8. Droit applicable</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Les présentes mentions légales sont régies par le droit français.
            </p>
            <p className="text-text-secondary leading-relaxed">
              En cas de litige et à défaut d'accord amiable, le litige sera porté devant les tribunaux français conformément 
              aux règles de compétence en vigueur.
            </p>
          </section>

          {/* Section Contact */}
          <section className="pt-8 border-t border-border-primary">
            <h2 className="text-2xl font-bold text-text-primary mb-4">Contact</h2>
            <p className="text-text-secondary leading-relaxed">
              Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à l'adresse email : 
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

