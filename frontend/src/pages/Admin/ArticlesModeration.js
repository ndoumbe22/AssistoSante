import React, { useState, useEffect } from "react";
import {
  FaCheck,
  FaTimes,
  FaBan,
  FaSearch,
  FaChartBar,
  FaStar,
  FaRegStar,
  FaTrash,
  FaRedo,
} from "react-icons/fa";
import articleService from "../../services/articleService";

function ArticlesModeration() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [stats, setStats] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState(null); // Default filter

  useEffect(() => {
    loadArticles();
    loadStatistics();
  }, [filtreStatut]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await articleService.getArticlesAdmin(filtreStatut);
      setArticles(data);
    } catch (err) {
      setError(
        "Erreur lors du chargement des articles: " +
          (err.response?.data?.error || err.message)
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await articleService.getStatistiquesArticles();
      setStats(data);
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques:", err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "brouillon":
        return <span className="badge bg-secondary">Brouillon</span>;
      case "en_attente":
        return <span className="badge bg-warning">⏳ En attente</span>;
      case "valide":
        return <span className="badge bg-success">✅ Validé</span>;
      case "refuse":
        return <span className="badge bg-danger">Refusé</span>;
      case "desactive":
        return <span className="badge bg-danger">🚫 Désactivé</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const handleValider = async (articleId) => {
    const commentaire = prompt("Commentaire de validation (optionnel):") || "";
    if (window.confirm("Êtes-vous sûr de vouloir valider cet article ?")) {
      try {
        await articleService.validerArticle(articleId, commentaire);
        loadArticles();
        loadStatistics();
        alert("Article validé avec succès");
      } catch (err) {
        alert(
          "Erreur lors de la validation: " +
            (err.response?.data?.error || err.message)
        );
        console.error(err);
      }
    }
  };

  const handleReject = async (articleId) => {
    if (window.confirm("Êtes-vous sûr de vouloir refuser cet article ?")) {
      try {
        await articleService.refuserArticle(articleId, rejectionReason);
        setShowRejectModal(false);
        setRejectionReason("");
        loadArticles();
        loadStatistics();
        alert("Article refusé");
      } catch (err) {
        alert(
          "Erreur lors du refus: " + (err.response?.data?.error || err.message)
        );
        console.error(err);
      }
    }
  };

  const handleDesactiver = async (articleId) => {
    const commentaire = prompt("Motif de désactivation (optionnel):") || "";
    if (window.confirm("Êtes-vous sûr de vouloir désactiver cet article ?")) {
      try {
        await articleService.desactiverArticle(articleId, commentaire);
        loadArticles();
        loadStatistics();
        alert("Article désactivé");
      } catch (err) {
        alert(
          "Erreur lors de la désactivation: " +
            (err.response?.data?.error || err.message)
        );
        console.error(err);
      }
    }
  };

  const handleReactiver = async (articleId) => {
    if (window.confirm("Êtes-vous sûr de vouloir réactiver cet article ?")) {
      try {
        await articleService.reactiverArticle(articleId);
        loadArticles();
        loadStatistics();
        alert("Article réactivé");
      } catch (err) {
        alert(
          "Erreur lors de la réactivation: " +
            (err.response?.data?.error || err.message)
        );
        console.error(err);
      }
    }
  };

  const handleSupprimer = async (articleId, articleTitle) => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer définitivement l'article "${articleTitle}" ? Cette action est irréversible.`
      )
    ) {
      try {
        await articleService.deleteAdminArticle(articleId);
        loadArticles();
        loadStatistics();
        alert("Article supprimé définitivement");
      } catch (err) {
        alert(
          "Erreur lors de la suppression: " +
            (err.response?.data?.error || err.message)
        );
        console.error(err);
      }
    }
  };

  const handleVoirDetails = (article) => {
    // For now, we'll just show an alert with article details
    alert(
      `Titre: ${article.titre}\nAuteur: Dr. ${article.auteur_nom}\nStatut: ${article.statut}\nCatégorie: ${article.categorie}`
    );
  };

  const openRejectModal = (article) => {
    setSelectedArticle(article);
    setShowRejectModal(true);
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* 1. CARDS DE STATISTIQUES EN HAUT */}
      {stats && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-warning text-white">
              <div className="card-body text-center">
                <h2 className="display-4">{stats.en_attente}</h2>
                <p className="mb-0">⏳ En attente</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body text-center">
                <h2 className="display-4">{stats.valides}</h2>
                <p className="mb-0">✅ Validés</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-danger text-white">
              <div className="card-body text-center">
                <h2 className="display-4">{stats.desactives}</h2>
                <p className="mb-0">🚫 Désactivés</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body text-center">
                <h2 className="display-4">{stats.total}</h2>
                <p className="mb-0">📊 Total</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. FILTRES PAR STATUT */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="btn-group" role="group">
            <button
              className={`btn ${
                filtreStatut === null ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => setFiltreStatut(null)}
            >
              Tous ({stats?.total || 0})
            </button>
            <button
              className={`btn ${
                filtreStatut === "en_attente"
                  ? "btn-warning"
                  : "btn-outline-warning"
              }`}
              onClick={() => setFiltreStatut("en_attente")}
            >
              En attente ({stats?.en_attente || 0})
            </button>
            <button
              className={`btn ${
                filtreStatut === "valide"
                  ? "btn-success"
                  : "btn-outline-success"
              }`}
              onClick={() => setFiltreStatut("valide")}
            >
              Validés ({stats?.valides || 0})
            </button>
            <button
              className={`btn ${
                filtreStatut === "desactive"
                  ? "btn-danger"
                  : "btn-outline-danger"
              }`}
              onClick={() => setFiltreStatut("desactive")}
            >
              Désactivés ({stats?.desactives || 0})
            </button>
          </div>
        </div>
      </div>

      {/* 3. TABLEAU DES ARTICLES */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Gestion des Articles</h5>
        </div>
        <div className="card-body">
          {articles.length === 0 ? (
            <div className="text-center py-5">
              <h4 className="text-muted">Aucun article trouvé</h4>
              <p className="text-muted">
                Aucun article ne correspond à vos critères de filtrage.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Auteur</th>
                    <th>Catégorie</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => (
                    <tr key={article.id}>
                      <td>
                        <strong>{article.titre}</strong>
                      </td>
                      <td>Dr. {article.auteur_nom}</td>
                      <td>
                        <span className="badge bg-secondary">
                          {article.categorie}
                        </span>
                      </td>
                      <td>
                        {article.statut === "en_attente" && (
                          <span className="badge bg-warning">
                            ⏳ En attente
                          </span>
                        )}
                        {article.statut === "valide" && (
                          <span className="badge bg-success">✅ Validé</span>
                        )}
                        {article.statut === "desactive" && (
                          <span className="badge bg-danger">🚫 Désactivé</span>
                        )}
                      </td>
                      <td>
                        {new Date(
                          article.date_publication
                        ).toLocaleDateString()}
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          {/* Bouton Valider (si en attente) */}
                          {article.statut === "en_attente" && (
                            <button
                              className="btn btn-success"
                              onClick={() => handleValider(article.id)}
                              title="Valider"
                            >
                              ✅
                            </button>
                          )}

                          {/* Bouton Désactiver (si validé) */}
                          {article.statut === "valide" && (
                            <button
                              className="btn btn-warning"
                              onClick={() => handleDesactiver(article.id)}
                              title="Désactiver"
                            >
                              🚫
                            </button>
                          )}

                          {/* Bouton Réactiver (si désactivé) */}
                          {article.statut === "desactive" && (
                            <button
                              className="btn btn-info"
                              onClick={() => handleReactiver(article.id)}
                              title="Réactiver"
                            >
                              🔄
                            </button>
                          )}

                          {/* Bouton Supprimer (toujours disponible) */}
                          <button
                            className="btn btn-danger"
                            onClick={() =>
                              handleSupprimer(article.id, article.titre)
                            }
                            title="Supprimer définitivement"
                          >
                            🗑️
                          </button>

                          {/* Bouton Voir détails */}
                          <button
                            className="btn btn-primary"
                            onClick={() => handleVoirDetails(article)}
                            title="Voir détails"
                          >
                            👁️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && selectedArticle && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Refuser l'article</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRejectModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Titre de l'article</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedArticle.titre}
                    disabled
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Motif du refus *</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Expliquez pourquoi cet article est refusé..."
                    required
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRejectModal(false)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleReject(selectedArticle.id)}
                  disabled={!rejectionReason.trim()}
                >
                  Refuser l'article
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArticlesModeration;
