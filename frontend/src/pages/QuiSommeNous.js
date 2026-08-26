import React from "react";

function QuiSommeNous() {
  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <h1 className="text-center mb-5">Qui sommes-nous ?</h1>

          <div className="card mb-4">
            <div className="card-body">
              <h3 className="card-title">Notre Mission</h3>
              <p className="card-text">
                AssitoSanté est une plateforme de santé virtuelle intégrée qui
                vise à faciliter l'accès aux soins de santé pour tous. Notre
                mission est de connecter les patients avec les professionnels de
                santé qualifiés, les établissements médicaux et les services de
                santé essentiels dans un environnement numérique sécurisé et
                convivial.
              </p>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-body">
              <h3 className="card-title">Notre Vision</h3>
              <p className="card-text">
                Nous aspirons à créer un écosystème de santé numérique où chaque
                individu peut accéder facilement à des soins de qualité, où les
                professionnels de santé peuvent optimiser leur pratique, et où
                la gestion de la santé devient proactive plutôt que réactive.
              </p>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-body">
              <h3 className="card-title">Nos Valeurs</h3>
              <ul className="card-text">
                <li>
                  <strong>Accessibilité :</strong> Rendre les soins de santé
                  accessibles à tous, où qu'ils soient.
                </li>
                <li>
                  <strong>Qualité :</strong> Garantir des services de santé de
                  haute qualité.
                </li>
                <li>
                  <strong>Innovation :</strong> Utiliser les dernières
                  technologies pour améliorer l'expérience de santé.
                </li>
                <li>
                  <strong>Sécurité :</strong> Protéger la confidentialité et la
                  sécurité des données des patients.
                </li>
                <li>
                  <strong>Empathie :</strong> Placer le patient au centre de
                  tout ce que nous faisons.
                </li>
              </ul>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-body">
              <h3 className="card-title">Nos Services</h3>
              <p className="card-text">
                Notre plateforme offre une gamme complète de services de santé,
                y compris la recherche de médecins, la prise de rendez-vous en
                ligne, les consultations à distance, le suivi des traitements,
                l'accès aux dossiers médicaux et bien plus encore.
              </p>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-body">
              <h3 className="card-title">Notre Équipe</h3>
              <p className="card-text">
                Nous sommes une équipe passionnée de professionnels de la santé,
                de développeurs, de designers et d'experts en technologie, tous
                unis par la mission de transformer l'expérience de santé grâce à
                l'innovation numérique.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuiSommeNous;
