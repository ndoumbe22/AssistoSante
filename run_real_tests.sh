#!/bin/bash

set -e  # Arrêter si une commande échoue

echo "╔════════════════════════════════════════════════════════╗"
echo "║   TESTS ASSISTOSANTÉ AVEC VRAIES DONNÉES              ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        exit 1
    fi
}

echo "📦 1. Préparation de l'environnement de test..."
echo "─────────────────────────────────────────────────────────"

# Aller dans le répertoire Django
cd Sante_Virtuelle

echo ""
echo "🧪 2. Tests Backend Django avec vraies données..."
echo "─────────────────────────────────────────────────────────"

# Tests d'authentification
python manage.py test sante_app.tests.integration.test_real_authentication --settings=Sante_Virtuelle.test_settings -v 2
print_result $? "Tests d'authentification réels"

# Tests de rendez-vous
python manage.py test sante_app.tests.integration.test_real_appointments --settings=Sante_Virtuelle.test_settings -v 2
print_result $? "Tests de rendez-vous réels"

# Tests de documents
python manage.py test sante_app.tests.integration.test_real_medical_documents --settings=Sante_Virtuelle.test_settings -v 2
print_result $? "Tests de documents médicaux réels"

# Tests de rappels
python manage.py test sante_app.tests.integration.test_real_medication_reminders --settings=Sante_Virtuelle.test_settings -v 2
print_result $? "Tests de rappels réels"

# Tests E2E backend
python manage.py test sante_app.tests.e2e.test_complete_patient_workflow --settings=Sante_Virtuelle.test_settings -v 2
print_result $? "Tests workflow patient complet"

echo ""
echo "⚛️  3. Tests Frontend React avec vraies données..."
echo "─────────────────────────────────────────────────────────"

cd ../frontend

# Tests d'intégration React
npm test -- --testPathPattern=integration --watchAll=false
REACT_RESULT=$?
print_result $REACT_RESULT "Tests d'intégration React réels"

echo ""
echo "📊 4. Génération des rapports..."
echo "─────────────────────────────────────────────────────────"

# Retour au répertoire racine
cd ..

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║              TESTS TERMINÉS AVEC SUCCÈS                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📁 Rapports disponibles dans:"
echo "   - test_reports/ (à créer)"
echo ""