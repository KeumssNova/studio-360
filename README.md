# Studio 360

Site de réservation des espaces de Studio 360 (plateaux TV, studios, bureaux). Refonte de la maquette Lovable du client, avec son contenu repris tel quel (`src/data/catalogue.ts`).

Rien n'est en ligne. Hébergement, nom de domaine, envoi des e-mails et paiement se décident avec le client : questions dans la note `projets/Studio 360.md` du coffre nova-brain.

## Ce que fait le site

- Pages publiques : accueil, espaces (filtre par catégorie), fiche de chaque espace, fiche tarifaire imprimable, contact, mentions légales, conditions générales, confidentialité.
- Réservation en ligne : date, créneau (1 h minimum, ou journée de 8h à 17h), options, coordonnées selon le profil (particulier, société, association). Le prix HT et TTC se calcule en direct. Le créneau se bloque à l'envoi, le studio confirme ou refuse.
- Chaque demande a sa page privée (lien envoyé par e-mail) et son récapitulatif en PDF.
- Compte client sans mot de passe : lien de connexion par e-mail, ou Google si configuré.
- Rétractation des particuliers : bouton en deux temps sur la page de la réservation, accusé de réception horodaté, délai calculé selon le Code de la consommation (L221-18, L221-19). Le studio voit la différence entre rétractation et simple annulation.
- Gestion (`/gestion`, réservée aux e-mails de `ADMIN_EMAILS`) : demandes à confirmer, conflits de créneaux, confirmation avec message au client, refus, annulation, blocage de créneaux, prix modifiables, export CSV.

## Lancer en local

```bash
npm install
cp .env.example .env.local   # puis remplir ADMIN_EMAILS avec un e-mail de test
npm run dev                  # http://localhost:3000
```

- La base est un Postgres embarqué (PGlite) dans `./data/pglite`, créée et remplie au premier démarrage. Un seul processus à la fois : arrêter `npm run dev` avant `npm run build` ou `npm start`.
- Sans `RESEND_API_KEY`, aucun e-mail ne part : ils sont écrits dans `./.outbox` et lisibles sur `/dev/boite` (page coupée en production).
- Pour entrer dans `/gestion` : se connecter sur `/connexion` avec un e-mail listé dans `ADMIN_EMAILS`, puis ouvrir le lien reçu dans `/dev/boite`.

Vérifications :

```bash
npm test             # règles de prix, créneaux, délai de rétractation
npx tsc --noEmit     # types
npm run build        # build de production
```

## Photos du client

Les photos actuelles viennent de la maquette, en basse définition. Quand le client envoie les originaux :

1. Les ranger dans `photos-originales/<slug>/` (dossier ignoré par git), un dossier par espace : `grand-plateau-tv`, `grand-fond-vert`, `petit-fond-vert`, `studio-podcast`, `studio-enregistrement`, `salle-formation-reunion`, `petit-bureau`, `grand-bureau`, et `cabines` pour les trois cabines de montage.
2. Nommer chaque fichier en décrivant la photo, dans l'ordre voulu : `01-plateau-vu-de-la-regie.jpg` donne le texte alternatif « Plateau vu de la regie ». Un nom d'appareil (`IMG_1234.jpg`) ne décrit rien : le script le signale.
3. `npm run photos`. Le script redresse, réduit à 1920 px de large, retire les métadonnées (dont la position GPS), écrit les photos dans `public/espaces/`, une image de partage 1200 x 630 par espace dans `public/og/`, et la liste dans `src/data/photos-client.ts`. Il signale les photos trop petites, en hauteur ou illisibles.
4. Relancer le site et vérifier les galeries.

Formats lus : JPEG, PNG, WebP, TIFF. Les photos HEIC d'iPhone s'exportent d'abord en JPEG. Un espace sans dossier garde ses photos actuelles.

## Référencement

- Chaque page publique a son titre, sa description, sa canonique et son `og:url` (même adresse), son image de partage (Open Graph et X).
- Données structurées : `Organization` sur l'accueil tant que l'adresse est vide, `LocalBusiness` avec adresse et fourchette de prix dès que `CONTACT.adresse` est rempli. Fil d'Ariane (`BreadcrumbList`) sur chaque fiche d'espace.
- `robots.txt` et `sitemap.xml` sont générés. Les pages privées (compte, gestion, réservation, connexion) sont exclues et en `noindex`.
- Tout repose sur `SITE_URL` : sans lui, les adresses pointent sur localhost.

## Sécurité

- En-têtes sur toutes les pages (`next.config.ts`, sources en commentaire) : politique de sécurité du contenu sans ressource externe, interdiction d'afficher le site dans un cadre, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, pas de `X-Powered-By`. HSTS s'ajoute seul quand `SITE_URL` est en https.
- **Les en-têtes se figent au build** : `SITE_URL` doit être défini avant `npm run build`.
- Ajouter un service externe (mesure d'audience, carte, vidéo, chat) demande d'ouvrir sa source dans la politique de sécurité du contenu, sinon le navigateur le bloque.
- Formulaires publics (réservation, contact, connexion) : limite d'envois par heure et par adresse IP (`src/lib/limite.ts`, seuils provisoires), et champ piège contre les robots. L'IP n'est gardée qu'en empreinte, 24 h, comme l'annonce la politique de confidentialité.
- La limite lit l'IP dans `x-forwarded-for`. Vercel réécrit cet en-tête. Chez un autre hébergeur, vérifier que son proxy le réécrit aussi, sinon un robot peut le falsifier.

## Variables d'environnement

| Variable | Rôle | Vide |
| --- | --- | --- |
| `SITE_URL` | URL publique, pour les liens des e-mails et des PDF | `http://localhost:3000` |
| `ADMIN_EMAILS` | E-mails qui ont accès à `/gestion`, séparés par des virgules | personne n'a accès |
| `STUDIO_EMAIL` | Reçoit les demandes et les messages de contact, sert de « répondre à » | `studio360@gmail.com` (maquette) |
| `DATABASE_URL` | URL Postgres de production | PGlite local |
| `RESEND_API_KEY` | Envoi réel des e-mails | e-mails dans `.outbox` en local ; **en production, l'envoi échoue avec une erreur** |
| `MAIL_FROM` | Expéditeur, sur le domaine vérifié chez Resend | |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Bouton « Continuer avec Google » | bouton masqué |

Les clés vont dans `.env.local` (ignoré par git) ou dans les variables de l'hébergeur, jamais dans le code.

## Mise en ligne

Dans l'ordre :

1. **Contenu du client** : adresse postale (`CONTACT.adresse` dans `src/data/catalogue.ts`, elle sert au formulaire de rétractation et aux données structurées), compte Instagram exact (puis `instagramVerifie: true`), photos en bonne définition passées par `npm run photos`, tous les passages entre crochets des pages légales (`src/app/mentions-legales`, `src/app/cgv`, `src/app/confidentialite`).
2. **Relecture juridique** des trois pages légales par un professionnel. L'encadré « Projet de texte » de `src/components/PageLegale.tsx` s'enlève seulement après.
3. **Base Postgres** de production, dans l'Union européenne de préférence : `DATABASE_URL`. Les tables se créent seules au premier démarrage. PGlite ne convient pas à un hébergement serverless (disque effacé à chaque déploiement).
4. **E-mails** : domaine vérifié chez Resend (enregistrements DNS), puis `RESEND_API_KEY` et `MAIL_FROM`.
5. **Domaine** : `SITE_URL` sur le domaine final, en https.
6. **Google** (facultatif) : identifiants OAuth au nom du studio, URI de redirection `https://<domaine>/auth/google/retour`.
7. `ADMIN_EMAILS` et `STUDIO_EMAIL` avec les vraies adresses du studio.
8. Tester une réservation complète sur le domaine final : demande, e-mail du studio, confirmation, e-mail du client, PDF, rétractation.
9. **Google** : déclarer le site dans Search Console et y envoyer `https://<domaine>/sitemap.xml`. Créer ou relier la fiche d'établissement Google du studio (même nom, même adresse que sur le site) : c'est elle qui fait apparaître le studio sur Maps.

### Coûts relevés le 6 novembre 2026 (pages tarifs officielles)

- Vercel : l'offre gratuite (Hobby) est réservée à un usage personnel et non commercial. Le site d'une entreprise demande l'offre Pro, 20 $ par mois et par membre, avec 20 $ d'usage inclus ([vercel.com/pricing](https://vercel.com/pricing)).
- Resend : gratuit jusqu'à 3 000 e-mails par mois et 100 par jour, 3 domaines. Ensuite Pro à 20 $ par mois pour 50 000 e-mails ([resend.com/pricing](https://resend.com/pricing)).
- Neon (Postgres) : gratuit jusqu'à 1 Go par projet. Au-delà, paiement à l'usage, sans forfait de base ([neon.com/pricing](https://neon.com/pricing)). Région européenne non vérifiée sur la page tarifs.
- Stripe, si le client veut un paiement en ligne : 1,5 % + 0,25 € par carte de l'Espace économique européen, sans abonnement ([stripe.com/fr/pricing](https://stripe.com/fr/pricing)).
- Nom de domaine : prix non relevé, à lire chez le registraire au moment de l'achat.

## Paiement

Rien ne se paie sur le site : le studio confirme, puis encaisse comme il veut. Si le client choisit un acompte ou un paiement en ligne, il faut ajouter Stripe Checkout au moment de la confirmation, et mettre à jour les conditions générales (article 5) et la politique de confidentialité.

## À ne pas oublier

- **Conditions générales** : à chaque modification du texte de `src/app/cgv/page.tsx`, changer `VERSION_CGV` dans `src/lib/regles.ts`. Chaque réservation garde la version acceptée (base, e-mails, PDF, export).
- **Jours fériés** : le délai de rétractation se prolonge après un samedi, un dimanche ou un jour férié (art. L221-19 du Code de la consommation, jours fériés de l'art. L3133-1 du Code du travail). Si le studio est en Alsace-Moselle, ajouter le Vendredi saint et le 26 décembre dans `jourFerie()` (`src/lib/regles.ts`, art. L3134-13).
- **Prix** : ceux du catalogue ne servent qu'au premier remplissage de la base. Ensuite, ils se changent dans `/gestion`.
- **Durées de conservation** des réservations et des messages : pas encore fixées, aujourd'hui rien ne s'efface. À décider avec le studio, puis à programmer.
