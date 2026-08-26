import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import articleService from "../../services/articleService";

function ArticleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titre: "",
    resume: "",
    contenu: "",
    categorie: "autre",
    tags: "",
  });

  const categories = [
    { value: "prevention", label: "Prévention" },
    { value: "nutrition", label: "Nutrition" },
    { value: "maladies", label: "Maladies" },
    { value: "bien_etre", label: "Bien-être" },
    { value: "grossesse", label: "Grossesse" },
    { value: "pediatrie", label: "Pédiatrie" },
    { value: "geriatrie", label: "Gériatrie" },
    { value: "autre", label: "Autre" },
  ];

  const loadArticle = useCallback(async () => {
    try {
      setLoading(true);
      const data = await articleService.getMyArticleDetail(id);
      setFormData({
        titre: data.titre || "",
        resume: data.resume || "",
        contenu: data.contenu || "",
        categorie: data.categorie || "autre",
        tags: data.tags || "",
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement de l'article");
      navigate("/medecin/articles");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (isEdit) {
      loadArticle();
    }
  }, [isEdit, loadArticle]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    if (!formData.titre.trim()) {
      toast.error("Veuillez remplir le titre");
      return false;
    }
    if (!formData.resume.trim()) {
      toast.error("Veuillez remplir le résumé");
      return false;
    }
    if (!formData.contenu.trim()) {
      toast.error("Veuillez remplir le contenu");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      if (isEdit) {
        await articleService.updateArticle(id, formData);
        toast.success("Article mis à jour avec succès");
      } else {
        await articleService.createArticle(formData);
        toast.success("Article créé avec succès");
      }

      navigate("/medecin/articles");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Erreur lors de l'enregistrement"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.titre || !formData.contenu) {
      toast.error("Le titre et le contenu sont obligatoires");
      return;
    }

    try {
      setLoading(true);

      const articleData = {
        ...formData,
        statut: 'brouillon'
      };

      console.log("📤 Données envoyées (brouillon):", articleData);

      if (isEdit) {
        await articleService.updateArticle(id, articleData);
        toast.success("Brouillon enregistré avec succès");
      } else {
        const article = await articleService.createArticle(articleData);
        console.log("✅ Réponse du serveur (brouillon):", article);
        toast.success("Brouillon enregistré avec succès");
      }

      navigate("/medecin/articles");
    } catch (error) {
      console.error("❌ ERREUR COMPLÈTE (brouillon):", error);
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || JSON.stringify(error.response?.data)
        || error.message 
        || "Une erreur est survenue";
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const articleData = {
        ...formData,
        statut: 'en_attente'
      };

      console.log("📤 Données envoyées (soumission):", articleData);

      if (isEdit) {
        await articleService.updateArticle(id, articleData);
        toast.success("Article soumis pour validation avec succès");
      } else {
        const article = await articleService.createArticle(articleData);
        console.log("✅ Réponse du serveur (création):", article);
        toast.success("Article soumis pour validation avec succès");
      }

      navigate("/medecin/articles");
    } catch (error) {
      console.error("❌ ERREUR COMPLÈTE (soumission):", error);
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || JSON.stringify(error.response?.data)
        || error.message 
        || "Une erreur est survenue";
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isEdit) {
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header avec titre et bouton retour */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0">
              <i className="bi bi-file-text me-2"></i>
              {isEdit ? "Modifier l'article" : "Nouvel Article"}
            </h2>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate("/medecin/articles")}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Retour
            </button>
          </div>
        </div>
      </div>

      {/* Formulaire dans une card avec shadow et rounded corners */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm rounded-3 border-0">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  {/* Colonne gauche */}
                  <div className="col-lg-8">
                    {/* Titre avec label flottant */}
                    <div className="mb-4">
                      <label className="form-label fw-bold mb-2">Titre *</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        name="titre"
                        value={formData.titre}
                        onChange={handleChange}
                        required
                        maxLength="200"
                        placeholder="Entrez le titre de votre article"
                      />
                      <div className="form-text text-end">
                        {formData.titre.length}/200 caractères
                      </div>
                    </div>

                    {/* Résumé avec label flottant */}
                    <div className="mb-4">
                      <label className="form-label fw-bold mb-2">
                        Résumé *
                      </label>
                      <textarea
                        className="form-control"
                        name="resume"
                        value={formData.resume}
                        onChange={handleChange}
                        rows="4"
                        required
                        maxLength="500"
                        placeholder="Résumé concis de votre article"
                      />
                      <div className="form-text text-end">
                        {formData.resume.length}/500 caractères
                      </div>
                    </div>

                    {/* Contenu avec éditeur de texte enrichi */}
                    <div className="mb-4">
                      <label className="form-label fw-bold mb-2">
                        Contenu de l'article *
                      </label>
                      <textarea
                        className="form-control"
                        name="contenu"
                        value={formData.contenu}
                        onChange={handleChange}
                        rows="12"
                        required
                        placeholder="Rédigez votre article ici..."
                      />
                      <div className="form-text">
                        Utilisez des paragraphes pour une meilleure lisibilité
                      </div>
                    </div>
                  </div>

                  {/* Colonne droite */}
                  <div className="col-lg-4">
                    {/* Catégorie */}
                    <div className="mb-4">
                      <label className="form-label fw-bold mb-2">
                        Catégorie
                      </label>
                      <select
                        className="form-select"
                        name="categorie"
                        value={formData.categorie}
                        onChange={handleChange}
                      >
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tags */}
                    <div className="mb-4">
                      <label className="form-label fw-bold mb-2">Tags</label>
                      <input
                        type="text"
                        className="form-control"
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                        placeholder="Ex: diabète, nutrition, prévention"
                      />
                      <div className="form-text">
                        Séparez les tags par des virgules
                      </div>
                    </div>
                  </div>
                </div>

                {/* Boutons d'action stylés */}
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="d-flex justify-content-between flex-wrap">
                      <button
                        type="button"
                        className="btn btn-secondary mb-2"
                        onClick={() => navigate("/medecin/articles")}
                      >
                        <i className="bi bi-x-circle me-2"></i>
                        Annuler
                      </button>

                      <div className="d-flex flex-wrap">
                        <button
                          type="button"
                          className="btn btn-outline-primary mb-2 me-2"
                          onClick={handleSaveDraft}
                          disabled={loading}
                        >
                          {loading ? (
                            <span className="spinner-border spinner-border-sm me-2"></span>
                          ) : (
                            <i className="bi bi-save me-2"></i>
                          )}
                          Enregistrer comme brouillon
                        </button>

                        <button
                          type="button"
                          className="btn btn-warning mb-2 me-2"
                          onClick={handleSubmitForReview}
                          disabled={loading}
                        >
                          {loading ? (
                            <span className="spinner-border spinner-border-sm me-2"></span>
                          ) : (
                            <i className="bi bi-send me-2"></i>
                          )}
                          Soumettre pour validation
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Messages de succès/erreur toast */}
      {/* Les toasts sont déjà gérés par le toast.error et toast.success dans le code */}
    </div>
  );
}

export default ArticleForm;
