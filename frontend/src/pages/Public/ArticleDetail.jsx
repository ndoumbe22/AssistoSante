import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import articleService from "../../services/articleService";
import "./ArticleDetail.css";

function ArticleDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadArticle();
  }, [slug]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const data = await articleService.getPublicArticle(slug);
      setArticle(data);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Article non trouvé");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  if (loading) {
    return (
      <div className="article-detail-loading">
        <div className="spinner"></div>
        <p>Chargement de l'article...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="article-detail-error">
        <div className="error-icon">📄</div>
        <h2>Article non trouvé</h2>
        <p>L'article que vous recherchez n'existe pas ou n'est plus disponible.</p>
        <button onClick={() => navigate("/articles")} className="btn-back-error">
          ← Retour aux articles
        </button>
      </div>
    );
  }

  return (
    <div className="article-detail-page">
      {/* Hero Section with Image */}
      <div className="article-hero" style={{
        backgroundImage: article.image ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${article.image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div className="hero-content">
          <button onClick={() => navigate("/articles")} className="btn-back">
            ← Retour aux articles
          </button>

          <div className="article-meta-top">
            <span className="category-badge">{article.categorie}</span>
            {article.is_featured && (
              <span className="featured-badge">
                <i className="bi bi-star-fill"></i> À la Une
              </span>
            )}
          </div>

          <h1 className="article-title-hero">{article.titre}</h1>

          <div className="article-info">
            <div className="info-item">
              <i className="bi bi-person-circle"></i>
              <span>Dr. {article.auteur_nom}</span>
            </div>
            <div className="info-item">
              <i className="bi bi-calendar3"></i>
              <span>{formatDate(article.date_publication)}</span>
            </div>
            <div className="info-item">
              <i className="bi bi-eye"></i>
              <span>{article.vues} vues</span>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="article-container">
        <div className="article-wrapper">
          {/* Resume */}
          <div className="article-resume">
            <p>{article.resume}</p>
          </div>

          {/* Content */}
          <div className="article-content-body">
            {article.contenu ? (
              article.contenu.split('\n\n').map((paragraph, index) => (
                paragraph.trim() && (
                  <p key={index} className="content-paragraph">
                    {paragraph}
                  </p>
                )
              ))
            ) : (
              <p className="no-content">Contenu non disponible</p>
            )}
          </div>

          {/* Tags */}
          {article.tags && (
            <div className="article-tags">
              <span className="tags-label">
                <i className="bi bi-tags"></i> Tags :
              </span>
              {article.tags.split(',').map((tag, index) => (
                <span key={index} className="tag-item">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Share Buttons - REMOVED AS REQUESTED */}
        </div>

        {/* Sidebar - REMOVED AUTHOR AND RELATED ARTICLES AS REQUESTED */}
      </div>
    </div>
  );
}

export default ArticleDetail;