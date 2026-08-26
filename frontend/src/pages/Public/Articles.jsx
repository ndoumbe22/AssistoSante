import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import articleService from "../../services/articleService";
import "./ArticlesPublics.css";

function ArticlesPublics() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategorie, setSelectedCategorie] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const categories = [
    { value: "all", label: "Toutes" },
    { value: "prevention", label: "Prévention" },
    { value: "nutrition", label: "Nutrition" },
    { value: "maladies", label: "Maladies" },
    { value: "bien_etre", label: "Bien-être" },
    { value: "grossesse", label: "Grossesse" },
    { value: "pediatrie", label: "Pédiatrie" },
    { value: "geriatrie", label: "Gériatrie" },
    { value: "autre", label: "Autre" },
  ];

  useEffect(() => {
    loadArticles(1);
  }, [selectedCategorie]);

  const loadArticles = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      const filters = { page, page_size: 12 };
      if (selectedCategorie !== "all") filters.categorie = selectedCategorie;

      const data = await articleService.getPublicArticles(filters);
      console.log("Articles data:", data);

      if (data.results) {
        const validArticles = data.results.filter(article => article.statut === 'valide');
        setArticles(validArticles);
        setTotalPages(Math.ceil(data.count / 12));
        setTotalCount(data.count);
      } else {
        const validArticles = data.filter(article => article.statut === 'valide');
        setArticles(validArticles);
        setTotalPages(1);
        setTotalCount(validArticles.length);
      }

      setCurrentPage(page);
    } catch (error) {
      console.error("Erreur:", error);
      setError("Erreur lors du chargement des articles");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getCategoryTags = (categorie) => {
    return categorie.split(',').map(cat => cat.trim());
  };

  if (loading) {
    return (
      <div className="articles-public-page">
        <div className="page-header">
          <div className="container">
            <button 
              onClick={() => navigate(-1)} 
              className="btn btn-light mb-3"
              style={{ color: '#000', border: '1px solid #ccc' }}
            >
              ← Retour
            </button>
          </div>
        </div>
        <div className="container">
          <div className="loading-container">
            <div className="spinner-border text-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="articles-public-page">
        <div className="page-header">
          <div className="container">
            <button 
              onClick={() => navigate(-1)} 
              className="btn btn-light mb-3"
              style={{ color: '#000', border: '1px solid #ccc' }}
            >
              ← Retour
            </button>
          </div>
        </div>
        <div className="container">
          <div className="alert alert-danger">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="articles-public-page">
      {/* Header */}
      <div className="page-header">
        <div className="container">
          <button 
            onClick={() => navigate(-1)} 
            className="btn btn-light mb-3"
            style={{ color: '#000', border: '1px solid #ccc' }}
          >
            ← Retour
          </button>
          <h1>📚 Articles de Santé</h1>
          <p>Découvrez les conseils de nos médecins experts</p>
        </div>
      </div>

      <div className="container">
        {/* Filters - REMOVED SEARCH BAR */}
        <div className="filters-bar">
          <select
            className="category-select"
            value={selectedCategorie}
            onChange={(e) => setSelectedCategorie(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Articles Grid */}
        {articles.length === 0 ? (
          <div className="no-articles">
            <p>Aucun article trouvé</p>
            <p className="text-muted">Il n'y a actuellement aucun article disponible dans cette catégorie.</p>
          </div>
        ) : (
          <div className="articles-grid-dark">
            {articles.map((article) => (
              <div
                key={article.id}
                className="card-dark"
                onClick={() => navigate(`/articles/${article.slug}`)}
              >
                <div className="main-content">
                  <div className="header">
                    <span>Article on</span>
                    <span>{formatDate(article.date_publication)}</span>
                  </div>
                  <p className="heading">{article.titre}</p>
                  <p className="description">{article.resume}</p>
                  <div className="categories">
                    {getCategoryTags(article.categorie).map((tag, index) => (
                      <span key={index}>{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="footer">
                  by Dr. {article.auteur_nom}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <button
              disabled={currentPage === 1}
              onClick={() => loadArticles(currentPage - 1)}
            >
              ← Précédent
            </button>
            <span>Page {currentPage} sur {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => loadArticles(currentPage + 1)}
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ArticlesPublics;