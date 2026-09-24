
-- Auto-create profile + auto-grant admin to tchapmoguy@gmail.com
CREATE OR REPLACE FUNCTION public.handle_new_user_with_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (user_id) DO NOTHING;

  IF NEW.email = 'tchapmoguy@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_admin();

-- Also grant admin to the email if user already exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'tchapmoguy@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Seed demo products with rich content
INSERT INTO public.products (slug, name, description, price_xaf, old_price_xaf, category, image_url, stock, is_trending, is_promo, rating, reviews_count, gallery_urls, video_url, benefits, specifications, box_contents, extra_details) VALUES
('smartphone-jangolo-x1', 'Smartphone Jangolo X1 — 128 Go', 'Un smartphone puissant et abordable, pensé pour le Cameroun : autonomie longue durée, double SIM et appareil photo qui rend justice à votre quotidien.', 89900, 119900, 'electronique', '/src/assets/jangolo-phone.jpg', 45, true, true, 4.7, 128,
ARRAY['/src/assets/jangolo-phone.jpg','/src/assets/jangolo-essentials.jpg','/src/assets/jangolo-pattern.jpg'], NULL,
ARRAY['Batterie 5000 mAh : 2 jours d''autonomie en usage normal','Double SIM 4G — gardez vos contacts pro et perso séparés','Écran 6,7" HD+ — vidéos et réseaux sociaux nets','Photos jusqu''à 50 MP, même en basse lumière','Charge rapide 18W incluse dans la boîte'],
'{"Écran":"6,7 pouces HD+","Processeur":"Octa-core 2.0 GHz","RAM":"6 Go","Stockage":"128 Go (extensible 512 Go)","Batterie":"5000 mAh","Caméra arrière":"50 MP + 2 MP","Caméra avant":"13 MP","Réseau":"4G LTE Dual SIM","OS":"Android 13"}'::jsonb,
ARRAY['1 x Smartphone Jangolo X1','1 x Chargeur 18W','1 x Câble USB-C','1 x Coque silicone','1 x Film de protection','1 x Guide rapide'],
'Garantie constructeur 12 mois. Livraison express 24h à Yaoundé/Douala. SAV WhatsApp 7j/7. Retour gratuit sous 7 jours si vous changez d''avis.'),

('ecouteurs-jangolo-pods', 'Écouteurs Jangolo Pods Bluetooth', 'Liberté totale, son puissant et confort longue durée. Vos podcasts et appels comme jamais.', 12500, 18000, 'electronique', '/src/assets/jangolo-earbuds.jpg', 80, true, true, 4.6, 92,
ARRAY['/src/assets/jangolo-earbuds.jpg','/src/assets/jangolo-pattern.jpg'], NULL,
ARRAY['Bluetooth 5.3 : connexion stable jusqu''à 10 m','Autonomie 24h avec le boîtier de charge','Réduction de bruit pour vos appels au taxi','Résistance à la sueur — parfait pour le sport'],
'{"Bluetooth":"5.3","Autonomie écouteurs":"6h","Autonomie totale":"24h","Étanchéité":"IPX4","Type de charge":"USB-C"}'::jsonb,
ARRAY['2 x Écouteurs','1 x Boîtier de charge','1 x Câble USB-C','3 paires d''embouts (S/M/L)','1 x Manuel'],
'Compatible iOS et Android. Garantie 6 mois.'),

('powerbank-jangolo-20000', 'PowerBank Jangolo 20000 mAh', 'Plus jamais à court de batterie pendant les coupures de courant.', 15500, 22000, 'electronique', '/src/assets/jangolo-powerbank.jpg', 60, true, true, 4.8, 156,
ARRAY['/src/assets/jangolo-powerbank.jpg','/src/assets/jangolo-essentials.jpg'], NULL,
ARRAY['Recharge votre téléphone 5 à 6 fois','3 ports USB — chargez toute la famille en même temps','Charge rapide 22.5W — gain de temps','Indicateur LED de batterie restante','Format compact qui rentre dans le sac à main'],
'{"Capacité":"20000 mAh","Sortie max":"22.5W","Ports":"2x USB-A + 1x USB-C","Entrée":"USB-C / Micro-USB","Poids":"380 g"}'::jsonb,
ARRAY['1 x PowerBank 20000 mAh','1 x Câble USB-C','1 x Pochette de transport','1 x Manuel'],
'Idéal en cas de coupure ENEO. Certification de sécurité incluse.'),

('montre-jangolo-fit', 'Montre connectée Jangolo Fit', 'Suivez votre santé et restez stylé. La montre qui s''adapte à votre rythme.', 18900, 28000, 'gadgets', '/src/assets/jangolo-watch.jpg', 35, true, true, 4.5, 64,
ARRAY['/src/assets/jangolo-watch.jpg','/src/assets/jangolo-pattern.jpg'], NULL,
ARRAY['Mesure du rythme cardiaque 24h/24','Suivi du sommeil et des pas','Notifications WhatsApp et appels','Étanche : résiste à la pluie et à la douche','Plus de 10 modes sportifs'],
'{"Écran":"1.69 pouces tactile","Étanchéité":"IP67","Autonomie":"7 jours","Capteurs":"Cardiaque, SpO2","Compatibilité":"Android / iOS"}'::jsonb,
ARRAY['1 x Montre Jangolo Fit','1 x Câble de charge magnétique','1 x Bracelet supplémentaire','1 x Manuel en français'],
'Application Jangolo Fit gratuite sur Play Store et App Store.'),

('sneakers-jangolo-street', 'Sneakers Jangolo Street', 'Légères, confortables, prêtes pour la ville comme pour le campus.', 22500, 30000, 'mode', '/src/assets/jangolo-sneakers.jpg', 50, false, true, 4.4, 38,
ARRAY['/src/assets/jangolo-sneakers.jpg','/src/assets/jangolo-pattern.jpg'], NULL,
ARRAY['Semelle amortissante pour marcher toute la journée','Tissu respirant — idéal en climat chaud','Design moderne, s''accorde avec tout','Lacets renforcés'],
'{"Pointures":"38 à 45","Matière":"Mesh + cuir synthétique","Semelle":"EVA + caoutchouc","Couleurs":"Noir, Blanc, Beige"}'::jsonb,
ARRAY['1 paire de sneakers','1 paire de lacets de rechange','1 boîte de rangement'],
'Échange de pointure gratuit si la taille ne convient pas (sous 7 jours).'),

('pagne-jangolo-royal', 'Pagne Jangolo Royal — 6 yards', 'Tissu wax authentique, couleurs vives qui ne pâlissent pas au lavage.', 9500, 12000, 'mode', '/src/assets/jangolo-fabric.jpg', 100, true, false, 4.9, 220,
ARRAY['/src/assets/jangolo-fabric.jpg','/src/assets/jangolo-pattern.jpg'], NULL,
ARRAY['Tissu 100% coton — agréable à porter','6 yards : assez pour un ensemble complet','Couleurs garanties au lavage','Motifs uniques dessinés au Cameroun'],
'{"Longueur":"6 yards (5.5 m)","Largeur":"1.18 m","Matière":"100% coton wax","Entretien":"Lavage à 30°C"}'::jsonb,
ARRAY['1 x Pagne 6 yards plié et emballé'],
'Parfait pour mariage, baptême, ou tenue du dimanche.'),

('foulard-jangolo-headwrap', 'Foulard / Gele Jangolo', 'Le headwrap qui couronne votre style en toute occasion.', 4500, 6000, 'mode', '/src/assets/jangolo-headwrap.jpg', 120, false, true, 4.7, 75,
ARRAY['/src/assets/jangolo-headwrap.jpg'], NULL,
ARRAY['Tissu rigide qui tient toute la journée','Long format pour des nœuds élaborés','Plusieurs couleurs disponibles'],
'{"Dimensions":"1.8 m x 0.6 m","Matière":"Polyester satiné","Lavage":"Main, eau froide"}'::jsonb,
ARRAY['1 x Foulard Jangolo'],
'Tutoriels de nouage offerts via notre WhatsApp.'),

('kit-essentiels-bureau', 'Kit Essentiels Bureau Jangolo', 'Tout ce qu''il faut pour un bureau organisé à la maison ou en entreprise.', 7900, 11000, 'essentiels', '/src/assets/jangolo-essentials.jpg', 70, false, false, 4.5, 22,
ARRAY['/src/assets/jangolo-essentials.jpg','/src/assets/jangolo-pattern.jpg'], NULL,
ARRAY['Carnet 200 pages + stylo premium','Organisateur de bureau en bambou','Idée cadeau pour collègues et étudiants'],
'{"Carnet":"A5, 200 pages lignées","Stylo":"Bille noire 0.7 mm","Organisateur":"Bambou naturel"}'::jsonb,
ARRAY['1 x Carnet A5','1 x Stylo','1 x Organisateur bambou','3 x Surligneurs'],
'Emballage cadeau offert sur demande.'),

('chargeur-rapide-25w', 'Chargeur rapide Jangolo 25W', 'Rechargez votre téléphone en 30 minutes seulement.', 6500, 9000, 'electronique', '/src/assets/jangolo-essentials.jpg', 90, false, true, 4.6, 41,
ARRAY['/src/assets/jangolo-essentials.jpg'], NULL,
ARRAY['Charge ultra-rapide 25W','Compatible iPhone, Samsung, Tecno, Infinix','Câble USB-C inclus'],
'{"Puissance":"25W","Sortie":"USB-C","Norme":"PD 3.0 + QC 4.0","Sécurité":"Anti-surchauffe"}'::jsonb,
ARRAY['1 x Chargeur 25W','1 x Câble USB-C 1m'],
'Compatible avec la plupart des smartphones récents.'),

('sacoche-jangolo-daily', 'Sacoche Jangolo Daily', 'Compacte, élégante, parfaite pour la moto-taxi et les sorties.', 8500, 12500, 'mode', '/src/assets/jangolo-essentials.jpg', 55, false, false, 4.3, 18,
ARRAY['/src/assets/jangolo-essentials.jpg'], NULL,
ARRAY['Bandoulière réglable','3 compartiments + poche cachée','Imperméable — protège vos affaires sous la pluie'],
'{"Dimensions":"25 x 18 x 8 cm","Matière":"Cuir synthétique","Couleur":"Noir / Marron"}'::jsonb,
ARRAY['1 x Sacoche Daily'],
'Garantie couture 6 mois.'),

('lampe-rechargeable-led', 'Lampe rechargeable LED Jangolo', 'Anti-coupures de courant : éclairez toute la maison sans ENEO.', 11500, 15000, 'essentiels', '/src/assets/jangolo-essentials.jpg', 65, true, true, 4.8, 88,
ARRAY['/src/assets/jangolo-essentials.jpg','/src/assets/jangolo-pattern.jpg'], NULL,
ARRAY['Autonomie 8h en mode normal','Recharge solaire en option','Port USB pour charger le téléphone','Crochet pour suspendre'],
'{"Capacité":"4000 mAh","Autonomie":"8h","Charge":"Secteur + Solaire","LEDs":"36 ampoules haute luminosité"}'::jsonb,
ARRAY['1 x Lampe LED','1 x Câble micro-USB','1 x Crochet','1 x Manuel'],
'Indispensable pendant les coupures. Garantie 6 mois.'),

('thermos-jangolo-1l', 'Thermos Jangolo 1L Inox', 'Garde votre café chaud 12h, votre eau fraîche 24h.', 7500, 10000, 'essentiels', '/src/assets/jangolo-essentials.jpg', 80, false, false, 4.5, 33,
ARRAY['/src/assets/jangolo-essentials.jpg'], NULL,
ARRAY['Inox 304 — sans BPA, sans goût métallique','Capacité 1L : assez pour toute la famille','Bouchon anti-fuite'],
'{"Capacité":"1 litre","Matière":"Inox 304 double paroi","Conservation chaud":"12h","Conservation froid":"24h"}'::jsonb,
ARRAY['1 x Thermos 1L','1 x Brosse de nettoyage'],
'Idéal pour les voyages en bus longue distance.');
