from sante_app.models import Article, Medecin
from django.utils import timezone
import random

# Get all doctors
medecins = Medecin.objects.all()

# Sample article data
sample_articles = [
    {
        "titre": "Les bienfaits de la marche pour la santé cardiovasculaire",
        "contenu": "La marche est l'une des activités physiques les plus simples et les plus bénéfiques pour la santé cardiovasculaire. Des études montrent que marcher 30 minutes par jour peut réduire le risque de maladie cardiaque de 30 %. Cette activité modérée améliore la circulation sanguine, renforce le cœur et aide à maintenir une pression artérielle normale. Pour les personnes souffrant d'hypertension, la marche régulière peut être aussi efficace que certains médicaments. Il est recommandé de maintenir un rythme soutenu où la respiration s'accélère légèrement mais où il est encore possible de converser.",
        "resume": "La marche quotidienne réduit significativement les risques cardiovasculaires et améliore la santé globale.",
        "categorie": "prevention"
    },
    {
        "titre": "Nutrition équilibrée : les bases d'une alimentation saine",
        "contenu": "Une alimentation équilibrée est essentielle pour maintenir une bonne santé et prévenir les maladies chroniques. Elle doit inclure une variété d'aliments de tous les groupes : fruits, légumes, céréales complètes, protéines maigres et produits laitiers. Les fruits et légumes fournissent des vitamines, minéraux et antioxydants essentiels. Les céréales complètes sont riches en fibres qui aident à la digestion et maintiennent un taux de sucre stable dans le sang. Les protéines maigres comme le poisson, la volaille et les légumineuses sont importantes pour la réparation et la croissance des tissus. Limiter les aliments transformés, les sucres ajoutés et les graisses saturées est également crucial.",
        "resume": "Une alimentation variée et équilibrée est la clé pour prévenir les maladies et maintenir une bonne santé.",
        "categorie": "nutrition"
    },
    {
        "titre": "Comprendre le diabète de type 2 : symptômes et gestion",
        "contenu": "Le diabète de type 2 est une maladie chronique caractérisée par une résistance à l'insuline et une production insuffisante d'insuline. Les symptômes incluent une soif excessive, des mictions fréquentes, une fatigue inhabituelle, une vision floue et une cicatrisation lente des plaies. Le facteur de risque principal est l'obésité, mais l'âge, les antécédents familiaux et le mode de vie sédentaire jouent également un rôle. La gestion implique des modifications du mode de vie comme une alimentation saine, l'exercice régulier et parfois des médicaments. Le suivi régulier de la glycémie est essentiel pour éviter les complications à long terme comme les problèmes rénaux, oculaires et cardiovasculaires.",
        "resume": "Le diabète de type 2 peut être géré efficacement par des changements de style de vie et un suivi médical approprié.",
        "categorie": "maladies"
    },
    {
        "titre": "Méditation et bien-être mental : techniques de relaxation",
        "contenu": "La méditation est une pratique ancienne qui offre de nombreux bénéfices pour le bien-être mental. Elle peut réduire le stress, l'anxiété et améliorer la concentration. Les techniques varient du mindfulness, qui consiste à être pleinement présent dans le moment, à la respiration consciente, en passant par la méditation guidée. Commencer par de courtes sessions de 5-10 minutes par jour peut être bénéfique. La régularité est plus importante que la durée. La méditation peut également améliorer la qualité du sommeil, renforcer le système immunitaire et favoriser une meilleure gestion des émotions. Il n'existe pas de 'bonne' ou de 'mauvaise' manière de méditer, l'essentiel est de trouver une technique qui convient à chacun.",
        "resume": "La méditation régulière améliore le bien-être mental, réduit le stress et favorise une meilleure qualité de vie.",
        "categorie": "bien_etre"
    },
    {
        "titre": "Suivi prénatal : calendrier et examens essentiels",
        "contenu": "Le suivi prénatal régulier est crucial pour la santé de la mère et du bébé. Les visites commencent généralement au début du deuxième mois de grossesse. Au cours des premiers mois, les examens incluent des analyses de sang, des échographies et des bilans de santé générale. Le suivi permet de détecter d'éventuelles complications, de surveiller la croissance du fœtus et de conseiller la future maman sur l'alimentation et le mode de vie. Des suppléments comme l'acide folique et le fer sont souvent prescrits. Les consultations deviennent plus fréquentes au troisième trimestre. L'échographie morphologique vers le 5ème mois permet d'examiner en détail le développement du bébé.",
        "resume": "Un suivi prénatal régulier garantit une grossesse en bonne santé et permet de prévenir les complications.",
        "categorie": "grossesse"
    },
    {
        "titre": "Vaccination infantile : calendrier et recommandations",
        "contenu": "La vaccination est l'un des moyens les plus efficaces de protéger les enfants contre les maladies graves. Le calendrier vaccinal recommandé commence dès la naissance avec le vaccin contre l'hépatite B. À 2 mois, les vaccinations contre la diphtérie, le tétanos, la coqueluche, la poliomyélite, Haemophilus influenzae de type b, le pneumocoque et le rotavirus sont administrées. Les rappels sont nécessaires à 4 et 6 mois. À 12 mois, les vaccins contre la rougeole, les oreillons et la rubéole sont donnés. Le respect du calendrier est important pour assurer une protection optimale. Les effets secondaires sont généralement minimes et temporaires, comme une légère fièvre ou une rougeur au point d'injection.",
        "resume": "Le respect du calendrier vaccinal protège les enfants contre des maladies potentiellement graves et mortelles.",
        "categorie": "pediatrie"
    },
    {
        "titre": "Prévention des chutes chez les personnes âgées",
        "contenu": "Les chutes sont la principale cause de blessures chez les personnes âgées. Elles peuvent entraîner des fractures graves, une perte d'autonomie et une dégradation de la qualité de vie. La prévention implique plusieurs aspects : améliorer l'environnement domestique (éclairage adéquat, suppression des obstacles, installation de barres d'appui), entretenir une activité physique régulière pour maintenir l'équilibre et la force musculaire, faire vérifier régulièrement la vue et l'audition, et revoir la médication avec un professionnel de santé car certains médicaments peuvent provoquer des vertiges. Des aides techniques comme des cannes ou des déambulateurs peuvent être prescrites si nécessaire.",
        "resume": "La prévention des chutes chez les personnes âgées passe par des modifications environnementales et un suivi médical approprié.",
        "categorie": "geriatrie"
    },
    {
        "titre": "L'importance du sommeil pour la santé globale",
        "contenu": "Le sommeil est un pilier essentiel de la santé. Un adulte a besoin de 7 à 9 heures de sommeil par nuit. Le manque de sommeil chronique est associé à de nombreux problèmes de santé : obésité, diabète, maladies cardiovasculaires, dépression et affaiblissement du système immunitaire. La qualité du sommeil est aussi importante que la quantité. Pour améliorer le sommeil, il est recommandé de maintenir un horaire régulier, d'éviter les écrans avant de dormir, de limiter la caféine en fin de journée et de créer un environnement propice au sommeil (chambre fraîche, sombre et silencieuse). Les troubles du sommeil comme l'apnée du sommeil doivent être évalués par un professionnel de santé.",
        "resume": "Un sommeil de qualité est essentiel pour la santé physique et mentale à tous les âges.",
        "categorie": "bien_etre"
    }
]

# Create 20 articles with random doctors
for i in range(20):
    article_data = sample_articles[i % len(sample_articles)].copy()
    article_data['auteur'] = random.choice(medecins)
    article_data['statut'] = 'valide'
    article_data['date_publication'] = timezone.now()
    
    # Add a unique identifier to the title to make it unique
    article_data['titre'] = f"{article_data['titre']} #{i+1}"
    
    article = Article.objects.create(**article_data)
    print(f"Created article: {article.titre}")

print(f"Successfully created {Article.objects.count()} articles")