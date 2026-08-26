Remplace complètement le contenu du fichier frontend/src/pages/Public/ArticleDetail.jsx par le code ci-dessous.

NOUVEAU CODE ArticleDetail.jsx
jsximport React, { useState, useEffect } from "react";
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
{/_ Hero Section with Image _/}
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

          {/* Share Buttons */}
          <div className="article-actions">
            <button className="action-btn share-btn">
              <i className="bi bi-share"></i> Partager
            </button>
            <button className="action-btn bookmark-btn">
              <i className="bi bi-bookmark"></i> Sauvegarder
            </button>
            <button className="action-btn print-btn" onClick={() => window.print()}>
              <i className="bi bi-printer"></i> Imprimer
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="article-sidebar">
          {/* Author Card */}
          <div className="author-card">
            <div className="author-avatar">
              <i className="bi bi-person-fill"></i>
            </div>
            <h3>À propos de l'auteur</h3>
            <h4>Dr. {article.auteur_nom}</h4>
            <p>Médecin expert en {article.categorie}</p>
            <button className="contact-btn">
              <i className="bi bi-envelope"></i> Contacter
            </button>
          </div>

          {/* Quick Info */}
          <div className="quick-info-card">
            <h3>Informations</h3>
            <div className="info-row">
              <span className="info-label">Catégorie</span>
              <span className="info-value">{article.categorie}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Date</span>
              <span className="info-value">{formatDate(article.date_publication)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Lectures</span>
              <span className="info-value">{article.vues}</span>
            </div>
            {article.date_modification && (
              <div className="info-row">
                <span className="info-label">Mise à jour</span>
                <span className="info-value">{formatDate(article.date_modification)}</span>
              </div>
            )}
          </div>

          {/* Related Articles Placeholder */}
          <div className="related-card">
            <h3>Articles similaires</h3>
            <p className="coming-soon">
              <i className="bi bi-clock-history"></i>
              Fonctionnalité à venir
            </p>
          </div>
        </aside>
      </div>
    </div>

);
}

export default ArticleDetail;

CRÉER LE FICHIER CSS
Crée le fichier frontend/src/pages/Public/ArticleDetail.css :
css/_ ArticleDetail.css _/

.article-detail-page {
min-height: 100vh;
background: #1a1a1a;
}

/_ Loading State _/
.article-detail-loading {
min-height: 100vh;
display: flex;
flex-direction: column;
justify-content: center;
align-items: center;
background: #1a1a1a;
color: white;
}

.spinner {
width: 50px;
height: 50px;
border: 4px solid rgba(255, 255, 255, 0.1);
border-left-color: #e81cff;
border-radius: 50%;
animation: spin 1s linear infinite;
margin-bottom: 1rem;
}

@keyframes spin {
to { transform: rotate(360deg); }
}

/_ Error State _/
.article-detail-error {
min-height: 100vh;
display: flex;
flex-direction: column;
justify-content: center;
align-items: center;
background: #1a1a1a;
color: white;
padding: 2rem;
text-align: center;
}

.error-icon {
font-size: 5rem;
margin-bottom: 1rem;
opacity: 0.5;
}

.btn-back-error {
margin-top: 2rem;
padding: 1rem 2rem;
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
border: none;
color: white;
border-radius: 50px;
cursor: pointer;
font-weight: 600;
transition: all 0.3s ease;
}

.btn-back-error:hover {
transform: translateY(-2px);
box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

/_ Hero Section _/
.article-hero {
height: 60vh;
min-height: 500px;
background-size: cover;
background-position: center;
display: flex;
align-items: flex-end;
padding: 3rem 2rem;
position: relative;
}

.hero-content {
max-width: 1200px;
margin: 0 auto;
width: 100%;
color: white;
}

.btn-back {
background: rgba(255, 255, 255, 0.2);
border: 2px solid rgba(255, 255, 255, 0.3);
color: white;
padding: 0.75rem 1.5rem;
border-radius: 50px;
cursor: pointer;
font-weight: 600;
transition: all 0.3s ease;
margin-bottom: 2rem;
backdrop-filter: blur(10px);
}

.btn-back:hover {
background: rgba(255, 255, 255, 0.3);
transform: translateX(-5px);
}

.article-meta-top {
display: flex;
gap: 1rem;
margin-bottom: 1.5rem;
}

.category-badge {
background: #e81cff;
padding: 0.5rem 1.5rem;
border-radius: 50px;
font-weight: 700;
text-transform: uppercase;
font-size: 0.85rem;
letter-spacing: 1px;
}

.featured-badge {
background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
padding: 0.5rem 1.5rem;
border-radius: 50px;
font-weight: 700;
font-size: 0.85rem;
}

.article-title-hero {
font-size: 3.5rem;
font-weight: 800;
line-height: 1.2;
margin-bottom: 1.5rem;
text-shadow: 2px 2px 20px rgba(0, 0, 0, 0.5);
}

.article-info {
display: flex;
gap: 2rem;
flex-wrap: wrap;
font-size: 1.1rem;
}

.info-item {
display: flex;
align-items: center;
gap: 0.5rem;
background: rgba(255, 255, 255, 0.1);
padding: 0.5rem 1rem;
border-radius: 50px;
backdrop-filter: blur(10px);
}

.info-item i {
font-size: 1.3rem;
}

/_ Content Container _/
.article-container {
max-width: 1400px;
margin: -100px auto 0;
padding: 0 2rem 4rem;
display: grid;
grid-template-columns: 1fr 350px;
gap: 3rem;
position: relative;
z-index: 10;
}

.article-wrapper {
background: linear-gradient(#2a2a2a, #2a2a2a) padding-box,
linear-gradient(145deg, transparent 35%, #e81cff, #40c9ff) border-box;
border: 2px solid transparent;
border-radius: 16px;
padding: 3rem;
color: white;
}

/_ Resume _/
.article-resume {
background: rgba(232, 28, 255, 0.1);
border-left: 4px solid #e81cff;
padding: 1.5rem;
margin-bottom: 2rem;
border-radius: 8px;
font-size: 1.2rem;
line-height: 1.8;
color: #ddd;
}

/_ Content Body _/
.article-content-body {
font-size: 1.1rem;
line-height: 2;
color: #ddd;
}

.content-paragraph {
margin-bottom: 1.5rem;
text-align: justify;
}

.content-paragraph:first-of-type::first-letter {
font-size: 4rem;
font-weight: bold;
float: left;
line-height: 1;
margin-right: 0.5rem;
color: #e81cff;
}

.no-content {
text-align: center;
color: #717171;
padding: 3rem;
font-style: italic;
}

/_ Tags _/
.article-tags {
display: flex;
flex-wrap: wrap;
gap: 0.75rem;
align-items: center;
margin: 3rem 0 2rem;
padding-top: 2rem;
border-top: 1px solid #444;
}

.tags-label {
font-weight: 700;
color: #e81cff;
}

.tag-item {
background: rgba(232, 28, 255, 0.2);
color: #e81cff;
padding: 0.5rem 1rem;
border-radius: 50px;
font-size: 0.9rem;
font-weight: 600;
}

/_ Actions _/
.article-actions {
display: flex;
gap: 1rem;
flex-wrap: wrap;
padding-top: 2rem;
border-top: 1px solid #444;
}

.action-btn {
flex: 1;
min-width: 150px;
padding: 1rem;
border: 2px solid #444;
background: transparent;
color: white;
border-radius: 12px;
cursor: pointer;
font-weight: 600;
transition: all 0.3s ease;
display: flex;
align-items: center;
justify-content: center;
gap: 0.5rem;
}

.action-btn:hover {
transform: translateY(-2px);
box-shadow: 0 4px 15px rgba(232, 28, 255, 0.3);
border-color: #e81cff;
background: rgba(232, 28, 255, 0.1);
}

/_ Sidebar _/
.article-sidebar {
display: flex;
flex-direction: column;
gap: 2rem;
}

.author-card,
.quick-info-card,
.related-card {
background: linear-gradient(#2a2a2a, #2a2a2a) padding-box,
linear-gradient(145deg, transparent 35%, #e81cff, #40c9ff) border-box;
border: 2px solid transparent;
border-radius: 16px;
padding: 2rem;
color: white;
}

.author-avatar {
width: 80px;
height: 80px;
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
border-radius: 50%;
display: flex;
align-items: center;
justify-content: center;
font-size: 3rem;
margin: 0 auto 1.5rem;
color: white;
}

.author-card h3 {
font-size: 0.9rem;
text-transform: uppercase;
color: #717171;
margin-bottom: 0.5rem;
}

.author-card h4 {
font-size: 1.5rem;
margin-bottom: 0.5rem;
}

.author-card p {
color: #aaa;
margin-bottom: 1.5rem;
}

.contact-btn {
width: 100%;
padding: 0.75rem;
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
border: none;
color: white;
border-radius: 50px;
cursor: pointer;
font-weight: 600;
transition: all 0.3s ease;
}

.contact-btn:hover {
transform: translateY(-2px);
box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

/_ Quick Info _/
.quick-info-card h3,
.related-card h3 {
font-size: 1.2rem;
margin-bottom: 1.5rem;
padding-bottom: 0.75rem;
border-bottom: 2px solid #444;
}

.info-row {
display: flex;
justify-content: space-between;
padding: 0.75rem 0;
border-bottom: 1px solid #333;
}

.info-label {
color: #717171;
font-weight: 600;
}

.info-value {
color: #e81cff;
font-weight: 600;
}

.coming-soon {
text-align: center;
color: #717171;
padding: 2rem 0;
font-style: italic;
}

/_ Print Styles _/
@media print {
.btn-back, .article-actions, .article-sidebar {
display: none !important;
}

.article-wrapper {
border: none;
background: white;
color: black;
}
}

/_ Responsive _/
@media (max-width: 1024px) {
.article-container {
grid-template-columns: 1fr;
}

.article-sidebar {
display: grid;
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
}

@media (max-width: 768px) {
.article-title-hero {
font-size: 2rem;
}

.article-hero {
height: auto;
min-height: 400px;
padding: 2rem 1rem;
}

.article-wrapper {
padding: 2rem 1.5rem;
}

.article-container {
margin-top: -50px;
padding: 0 1rem 2rem;
}

.article-actions {
flex-direction: column;
}

.action-btn {
min-width: 100%;
}
}
