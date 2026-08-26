import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "./components/Layout";
import Accueil from "./pages/Accueil";
import Cliniques from "./pages/Public/Cliniques";
import Dentistes from "./pages/Public/Dentistes";
import Hopitaux from "./pages/Public/Hopitaux";
import Pharmacie from "./pages/Public/Pharmacies";
import QuiSommeNous from "./pages/QuiSommeNous";
import MedecinSpecialiste from "./pages/MedecinSpecialiste";
import MedecinGeneraliste from "./pages/MedecinGeneraliste";
import RendezVous from "./pages/RendezVous";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "leaflet/dist/leaflet.css";
import Connecter from "./components/Connecter";
import Inscrire from "./components/Inscrire";
import ProtectedRoute from "./components/ProtectedRoute";
import Unauthorized from "./components/Unauthorized";

// Test Components (removed for cleanup)

// Patient Dashboard Components
import DashboardPatient from "./pages/Patient/DashboardPatient";
import EnhancedDashboardPatientV2 from "./pages/Patient/EnhancedDashboardPatientV2";
import Notifications from "./pages/Patient/Notifications";

import RendezVousPatient from "./pages/Patient/RendezVous";
import PriseDeRendezVous from "./pages/Patient/PriseDeRendezVous";
import DossierMedical from "./pages/Patient/DossierMedical";
import DocumentPartage from "./pages/Patient/DocumentPartage"; // Added DocumentPartage
import ProfilePatient from "./pages/Patient/Profile";
import BoiteMessagesPatient from "./pages/Patient/BoiteMessages";
import MedicationReminders from "./pages/Patient/MedicationReminders"; // Added medication reminders
import LocaliserCentres from "./pages/Patient/LocaliserCentres"; // Added LocaliserCentres
import ValiderRendezVous from "./pages/Patient/ValiderRendezVous"; // Added ValiderRendezVous

// Medecin Dashboard Components
import DashboardMedecin from "./pages/Medecin/DashboardMedecin";
import EnhancedDashboardMedecinV2 from "./pages/Medecin/EnhancedDashboardMedecinV2";
import DossiersPatients from "./pages/Medecin/Dashboard/DossiersPatients";
import RendezVousMedecin from "./pages/Medecin/RendezVous";
import DisponibilitesMedecin from "./pages/Medecin/Disponibilites";
import NotificationsMedecin from "./pages/Medecin/Notifications";
import ProfileMedecin from "./pages/Medecin/Profile";
import PatientsList from "./pages/Medecin/PatientsList"; // Added PatientsList

// Admin Dashboard Components
import DashboardAdmin from "./pages/Admin/DashboardAdmin";
import ChatbotSettings from "./pages/Admin/ChatbotSettings";
import EnhancedDashboardAdminV2 from "./pages/Admin/EnhancedDashboardAdminV2";
import UtilisateursAdmin from "./pages/Admin/Utilisateurs";
import MedecinsList from "./pages/Medecins";
import MedecinsSpecialiteAdmin from "./pages/Admin/MedecinsSpecialite";
import SecretairesAdmin from "./pages/Admin/Secretaires";
import PatientsAdmin from "./pages/Admin/Patients";
import SpecialiteAdmin from "./pages/Admin/Specialite";
import MessagesAdmin from "./pages/Admin/Messages";
import MessagerieMonitoring from "./pages/Admin/MessagerieMonitoring"; // Added messaging monitoring
import AppointmentManagement from "./pages/Admin/AppointmentManagement";

// Article Components
import ArticlesPublics from "./pages/Public/Articles"; // Updated extension
import ArticleDetail from "./pages/Public/ArticleDetail"; // Updated extension
import MesArticles from "./pages/Medecin/MesArticles";
import ArticleForm from "./pages/Medecin/ArticleForm";
import ArticlesModeration from "./pages/Admin/ArticlesModeration";

// Urgence Components
import UrgenceSOS from "./pages/Patient/UrgenceSOS";
import UrgencesDashboard from "./pages/Medecin/UrgencesDashboard";

// Policy Components
import PolitiqueConfidentialite from "./pages/Public/PolitiqueConfidentialite"; // Updated extension
import LocaliserServices from "./pages/Public/LocaliserServices"; // Added visitor localization
import SearchResults from "./pages/Public/SearchResults"; // Added search results

// Consultation Components
import ConsultationPage from "./pages/Consultation/ConsultationPage";
import ConsultationList from "./pages/Consultation/ConsultationList";

// Teleconsultation Components
import Chatbot from "./components/Chatbot";
import 'bootstrap-icons/font/bootstrap-icons.css';


function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <ToastContainer />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Accueil />} />
              <Route path="cliniques" element={<Cliniques />} />
              <Route path="dentistes" element={<Dentistes />} />
              <Route path="hopitaux" element={<Hopitaux />} />
              <Route path="pharmacie" element={<Pharmacie />} />
              <Route path="qui_sommes_nous" element={<QuiSommeNous />} />
              <Route path="medecins" element={<MedecinsList />} />
              <Route path="rendez_vous" element={<RendezVous />} />
              {/* Other routes that need the layout */}
              <Route path="localiser-services" element={<LocaliserServices />} />
              <Route path="search" element={<SearchResults />} />
            </Route>
            {/* Articles route without Layout wrapper for more space */}
            <Route path="/articles" element={<ArticlesPublics />} />
            <Route path="/articles/:slug" element={<ArticleDetail />} />
            <Route path="connecter" element={<Connecter />} />
            <Route path="inscrire" element={<Inscrire />} />
            {/* Protected Routes */}
            <Route
              path="/interface_patient/*"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <DashboardPatient />
                </ProtectedRoute>
              }
            />

            <Route path="chatbot" element={<Chatbot />} />
            <Route path="consultations" element={<ConsultationPage />} />
            <Route path="consultationsList" element={<ConsultationList />} />
            <Route path="/admin/chatbot" element={<ChatbotSettings />} />


            <Route
              path="/interface_medecin/*"
              element={
                <ProtectedRoute allowedRoles={["medecin"]}>
                  <DashboardMedecin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interface_admin/*"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <DashboardAdmin />
                </ProtectedRoute>
              }
            />

            {/* Medecin Dashboard Routes */}
            <Route path="medecin">
              <Route
                index
                element={
                  <ProtectedRoute allowedRoles={["medecin"]}>
                    <DashboardMedecin />
                  </ProtectedRoute>
                }
              />

              <Route
                path="dossier_patient"
                element={
                 <ProtectedRoute allowedRoles={["medecin"]}>
                   <DossiersPatients />
                 </ProtectedRoute>
                }
              />

              {/* Ajoute ici la route dossier_patient */}
  
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute allowedRoles={["medecin"]}>
                    <DashboardMedecin />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="dashboard-v2"
                element={
                  <ProtectedRoute allowedRoles={["medecin"]}>
                    <EnhancedDashboardMedecinV2 />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="rendez-vous"
                element={
                  <ProtectedRoute allowedRoles={["medecin"]}>
                    <RendezVousMedecin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="disponibilites"
                element={
                  <ProtectedRoute allowedRoles={["medecin"]}>
                    <DisponibilitesMedecin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="notifications"
                element={
                  <ProtectedRoute allowedRoles={["medecin"]}>
                    <NotificationsMedecin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute allowedRoles={["medecin"]}>
                    <ProfileMedecin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="urgences"
                element={
                  <ProtectedRoute allowedRoles={["medecin"]}>
                    <UrgencesDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="patients"
                element={
                  <ProtectedRoute allowedRoles={["medecin"]}>
                    <PatientsList />
                  </ProtectedRoute>
                }
              />
              
              {/* Medecin Article Routes */}
              <Route
                path="articles"
                element={
                  <ProtectedRoute allowedRoles={["medecin"]}>
                    <MesArticles />
                  </ProtectedRoute>
                }
              />
              <Route
                path="articles/nouveau"
                element={
                  <ProtectedRoute allowedRoles={["medecin"]}>
                    <ArticleForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="articles/:id/modifier"
                element={
                  <ProtectedRoute allowedRoles={["medecin"]}>
                    <ArticleForm />
                  </ProtectedRoute>
                }
              />

            </Route>

            {/* Patient Dashboard Routes */}
            <Route path="patient">
              <Route
                index
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <DashboardPatient />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <DashboardPatient />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard-v2"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <EnhancedDashboardPatientV2 />
                  </ProtectedRoute>
                }
              />
              <Route
                path="rendez-vous"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <RendezVousPatient />
                  </ProtectedRoute>
                }
              />
              <Route
                path="prise-rendez-vous"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <PriseDeRendezVous />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dossier-medical"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <DossierMedical />
                  </ProtectedRoute>
                }
              />
              <Route
                path="document-partage"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <DocumentPartage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <ProfilePatient />
                  </ProtectedRoute>
                }
              />
              <Route
                path="boite-email"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <BoiteMessagesPatient />
                  </ProtectedRoute>
                }
              />
              <Route
                path="medication-reminders"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <MedicationReminders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="urgence"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <UrgenceSOS />
                  </ProtectedRoute>
                }
              />
              <Route
                path="notifications"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              {/* Route path="messagerie" element={<ProtectedRoute allowedRoles={["patient"]}><MessageriePatient /></ProtectedRoute>} /> Removed patient messaging */}
              <Route
                path="localiser-centres"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <LocaliserCentres />
                  </ProtectedRoute>
                }
              />
              <Route
                path="rendez-vous/:id/valider"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <ValiderRendezVous />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Admin Dashboard Routes */}
            <Route path="admin">
              <Route
                index
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <DashboardAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <DashboardAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard-v2"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <EnhancedDashboardAdminV2 />
                  </ProtectedRoute>
                }
              />
              <Route
                path="utilisateurs"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <UtilisateursAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="medecins"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <MedecinsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="medecins-specialite"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <MedecinsSpecialiteAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="secretaires"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <SecretairesAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="patients"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <PatientsAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="specialite"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <SpecialiteAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="messages"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <MessagesAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="messagerie-monitoring"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <MessagerieMonitoring />
                  </ProtectedRoute>
                }
              />
              <Route
                path="appointments"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AppointmentManagement />
                  </ProtectedRoute>
                }
              />
              {/* Admin Article Routes */}
              <Route
                path="articles"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <ArticlesModeration />
                  </ProtectedRoute>
                }
              />
            </Route>
            {/* Test routes removed for cleanup */}
            <Route path="unauthorized" element={<Unauthorized />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
