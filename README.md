# PatrimoineLab

Mini-site statique d'analyse patrimoniale.

## V1
- Immobilier vs inflation sur 10 pays développés.
- Comparaison des prix immobiliers réels de 1975 à 2025.
- Simulation de réinvestissement des loyers dans un MSCI World théorique.
- Interface responsive pour iPhone, iPad et ordinateur.

## Mise en ligne avec GitHub Pages
1. Déposer tous les fichiers à la racine du dépôt.
2. Aller dans **Settings → Pages**.
3. Dans **Build and deployment**, choisir **Deploy from a branch**.
4. Sélectionner la branche **main** et le dossier **/(root)**.
5. Enregistrer.
6. GitHub fournit ensuite l'URL publique du site.

## Structure
- `index.html` : interface
- `style.css` : styles
- `app.js` : logique interactive
- `data/housing.json` : données immobilières et inflation

## Sources
Bank for International Settlements (BIS), Residential Property Price statistics.

## V1.1
- Rétablissement du survol interactif sur ordinateur.
- Support tactile iPhone/iPad par glissement sur le graphique.
- Affichage de l'année, des variations cumulées et des indices base 100.
