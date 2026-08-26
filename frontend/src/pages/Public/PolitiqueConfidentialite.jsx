import React from "react";

function PolitiqueConfidentialite() {
  return (
    <div className="container py-5">
      <h1 className="mb-4">Politique de Confidentialité</h1>
      <p className="lead">
        Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
      </p>

      <section className="mb-4">
        <h3>1. Collecte des données</h3>
        <p>AssitoSanté collecte les données suivantes :</p>
        <ul>
          <li>Données d'identification (nom, prénom, email)</li>
          <li>Données de santé (consultations, pathologies, traitements)</li>
          <li>Données de connexion (logs, IP)</li>
        </ul>
      </section>

      <section className="mb-4">
        <h3>2. Utilisation des données</h3>
        <p>Vos données sont utilisées pour :</p>
        <ul>
          <li>Fournir les services médicaux</li>
          <li>Gérer vos rendez-vous</li>
          <li>Améliorer nos services</li>
        </ul>
      </section>

      <section className="mb-4">
        <h3>3. Sécurité</h3>
        <p>
          Nous utilisons le chiffrement pour protéger vos données sensibles.
          Seuls les professionnels de santé autorisés peuvent accéder à votre
          dossier.
        </p>
      </section>

      <section className="mb-4">
        <h3>4. Vos droits (RGPD)</h3>
        <p>Vous avez le droit de :</p>
        <ul>
          <li>
            <strong>Accès</strong> : Consulter vos données
          </li>
          <li>
            <strong>Rectification</strong> : Corriger vos données
          </li>
          <li>
            <strong>Suppression</strong> : Demander la suppression (droit à
            l'oubli)
          </li>
          <li>
            <strong>Portabilité</strong> : Exporter vos données
          </li>
          <li>
            <strong>Opposition</strong> : Refuser certains traitements
          </li>
        </ul>
      </section>

      <section className="mb-4">
        <h3>5. Contact</h3>
        <p>
          Pour exercer vos droits : <strong>contact@assistosante.sn</strong>
        </p>
      </section>
    </div>
  );
}

export default PolitiqueConfidentialite;
