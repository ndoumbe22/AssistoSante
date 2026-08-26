ÉTAPE 1 : Nouveau Design pour ArticlesPublics.jsx
Remplace le code précédent par celui-ci qui correspond exactement au design demandé :
Fichier : frontend/src/pages/Public/ArticlesPublics.jsx
jsximport React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import articleService from "../../services/articleService";
import "./ArticlesPublics.css";

function ArticlesPublics() {
const navigate = useNavigate();
const [articles, setArticles] = useState([]);
const [loading, setLoading] = useState(true);
const [selectedCategorie, setSelectedCategorie] = useState("all");
const [searchTerm, setSearchTerm] = useState("");
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
}, [selectedCategorie, searchTerm]);

const loadArticles = async (page = currentPage) => {
try {
setLoading(true);
const filters = { page, page_size: 12 };
if (selectedCategorie !== "all") filters.categorie = selectedCategorie;
if (searchTerm) filters.search = searchTerm;

      const data = await articleService.getPublicArticles(filters);

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
    } finally {
      setLoading(false);
    }

};

const handleSearch = (e) => {
e.preventDefault();
loadArticles(1);
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
<div className="loading-container">
<div className="spinner-border text-primary"></div>
</div>
);
}

return (
<div className="articles-public-page">
{/_ Header _/}
<div className="page-header">
<div className="container">
<h1>📚 Articles de Santé</h1>
<p>Découvrez les conseils de nos médecins experts</p>
</div>
</div>

      <div className="container">
        {/* Filters */}
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

          <form onSubmit={handleSearch} className="search-box">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit">🔍</button>
          </form>
        </div>

        {/* Articles Grid */}
        {articles.length === 0 ? (
          <div className="no-articles">
            <p>Aucun article trouvé</p>
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

ÉTAPE 2 : CSS Exactement comme l'image
Fichier : frontend/src/pages/Public/ArticlesPublics.css
css/_ ArticlesPublics.css - Design sombre avec bordures dégradées _/

.articles-public-page {
min-height: 100vh;
background: #1a1a1a;
padding-bottom: 4rem;
}

.loading-container {
display: flex;
justify-content: center;
align-items: center;
min-height: 100vh;
background: #1a1a1a;
}

/_ Header _/
.page-header {
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
padding: 3rem 0;
text-align: center;
color: white;
margin-bottom: 3rem;
}

.page-header h1 {
font-size: 3rem;
font-weight: 800;
margin-bottom: 0.5rem;
}

.page-header p {
font-size: 1.2rem;
opacity: 0.9;
}

.container {
max-width: 1400px;
margin: 0 auto;
padding: 0 2rem;
}

/_ Filters _/
.filters-bar {
display: flex;
gap: 1rem;
margin-bottom: 3rem;
flex-wrap: wrap;
}

.category-select {
flex: 1;
min-width: 200px;
padding: 1rem;
background: #2a2a2a;
border: 2px solid #3a3a3a;
color: white;
border-radius: 12px;
font-size: 1rem;
}

.search-box {
flex: 2;
display: flex;
background: #2a2a2a;
border: 2px solid #3a3a3a;
border-radius: 12px;
overflow: hidden;
}

.search-box input {
flex: 1;
padding: 1rem;
background: transparent;
border: none;
color: white;
outline: none;
}

.search-box button {
padding: 1rem 2rem;
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
border: none;
color: white;
cursor: pointer;
font-size: 1.2rem;
}

/_ Articles Grid - Style sombre _/
.articles-grid-dark {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
gap: 2rem;
margin-bottom: 3rem;
}

/_ Card Style - Exactement comme l'image _/
.card-dark {
width: 100%;
height: 350px;
padding: 20px;
color: white;
background: linear-gradient(#212121, #212121) padding-box,
linear-gradient(145deg, transparent 35%, #e81cff, #40c9ff) border-box;
border: 2px solid transparent;
border-radius: 8px;
display: flex;
flex-direction: column;
cursor: pointer;
transform-origin: right bottom;
transition: all 0.6s cubic-bezier(0.23, 1, 0.320, 1);
}

.card-dark .main-content {
flex: 1;
display: flex;
flex-direction: column;
}

.card-dark .header {
display: flex;
justify-content: space-between;
margin-bottom: 1rem;
}

.card-dark .header span:first-child {
font-weight: 600;
color: #717171;
margin-right: 4px;
}

.card-dark .header span:last-child {
font-weight: 600;
color: white;
}

.card-dark .heading {
font-size: 24px;
margin: 24px 0 16px;
font-weight: 600;
line-height: 1.3;
display: -webkit-box;
-webkit-line-clamp: 2;
-webkit-box-orient: vertical;
overflow: hidden;
}

.card-dark .description {
font-size: 14px;
color: #aaa;
margin-bottom: 16px;
flex: 1;
display: -webkit-box;
-webkit-line-clamp: 3;
-webkit-box-orient: vertical;
overflow: hidden;
}

.card-dark .categories {
display: flex;
gap: 8px;
flex-wrap: wrap;
}

.card-dark .categories span {
background-color: #e81cff;
padding: 4px 8px;
font-weight: 600;
text-transform: uppercase;
font-size: 12px;
border-radius: 50em;
}

.card-dark .footer {
font-weight: 600;
color: #717171;
margin-top: 12px;
padding-top: 12px;
border-top: 1px solid #333;
}

.card-dark:hover {
transform: rotate(8deg);
}

/_ No Articles _/
.no-articles {
text-align: center;
padding: 5rem 2rem;
color: #717171;
font-size: 1.5rem;
}

/_ Pagination _/
.pagination-container {
display: flex;
justify-content: center;
align-items: center;
gap: 2rem;
margin-top: 3rem;
}

.pagination-container button {
padding: 0.75rem 2rem;
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
border: none;
color: white;
border-radius: 50px;
cursor: pointer;
font-weight: 600;
transition: all 0.3s ease;
}

.pagination-container button:disabled {
opacity: 0.5;
cursor: not-allowed;
}

.pagination-container button:not(:disabled):hover {
transform: translateY(-2px);
box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.pagination-container span {
color: white;
font-weight: 600;
}

/_ Responsive _/
@media (max-width: 768px) {
.articles-grid-dark {
grid-template-columns: 1fr;
}

.card-dark:hover {
transform: rotate(0deg);
}

.filters-bar {
flex-direction: column;
}

.page-header h1 {
font-size: 2rem;
}
}
