-- Shop catalog seed for Neon. Safe to re-run (upserts by slug). Run: npm run db:seed

insert into public.categories (slug, name, sort_order) values
  ('dvds','DVDs',1), ('books','Books',2), ('accessories','Accessories',3), ('members','S.K.I.F. Members',4), ('seminars','Virtual Training',5)
on conflict (slug) do nothing;

-- Products imported from skifusa-shop.com (images live in /public).
-- Safe to re-run: upserts by slug. Prices are in cents.
insert into public.products (slug, name, description, category_id, price_cents, sale_price_cents, image_url, stock, members_only)
select v.slug, v.name, v.descr, c.id, v.price, v.sale, v.img, 100, (v.cat = 'members')
from (values
  ('skif-passport','SKIF Passport','Official S.K.I.F. member passport.','members',1000,null::int,'/skif_passport.webp'),
  ('skif-stamps','SKIF Stamps','Official S.K.I.F. passport stamps.','members',400,null,'/skif_stamps.webp'),
  ('skif-usa-jp-certificates','SKIF USA – JP Certificates','S.K.I.F. kyu certificates (Japan).','members',400,null,'/kyu_japan_certificates.webp'),
  ('skif-usa-certificates','SKIF USA Certificates','S.K.I.F. USA kyu certificates.','members',250,null,'/kyu_usa_certificates.webp'),
  ('skif-patch','SKIF USA Patch','Official embroidered S.K.I.F. USA patch.','accessories',1000,null,'/skif_patch.webp'),
  ('skif-usa-t-shirt-black','SKIF-USA T-Shirt – Black','Black T-shirt with the S.K.I.F. USA emblem.','accessories',2200,1200,'/skif_usa_t_shirt_black_front_side.webp'),
  ('skif-usa-t-shirt-white','SKIF-USA T-Shirt – White','White T-shirt with the S.K.I.F. USA emblem.','accessories',2200,1200,'/skif_usa_t_shirt_white_front_side.webp'),
  ('tournament-mitts','Tournament Mitts','Tournament mitts with the S.K.I.F. USA emblem.','accessories',2500,null,'/mitts.webp')
) as v(slug,name,descr,cat,price,sale,img)
join public.categories c on c.slug = v.cat
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, category_id = excluded.category_id,
  price_cents = excluded.price_cents, sale_price_cents = excluded.sale_price_cents, image_url = excluded.image_url, members_only = excluded.members_only;

-- DVDs and books imported from skifusa-shop.com (images live in /public). Safe to re-run: upserts by slug.
delete from public.products where slug in ('26-karate-kata-dvd', 'kanazawa-fighting-techniques', 'kanazawa-autobiography');

insert into public.products (slug, name, description, category_id, price_cents, sale_price_cents, image_url, stock)
select v.slug, v.name, v.descr, c.id, v.price, v.sale, v.img, v.stock
from (values
  ('26-karate-kata', '26 Karate Kata', '26 Karate Kata by Hirokazu Kanazawa, Kancho.', 'dvds', 2995, null::int, '/26_karate_kata_dvd.webp', 7),
  ('dan-kata-dvd', 'Dan-Kata DVD', 'Dan Kata by Hirokazu Kanazawa, Kancho.

Sold "AS-IS". Please check for availability before purchase.', 'dvds', 2995, 500, '/dan_kata_web.webp', 100),
  ('hollywood-dvd', 'Hollywood DVD', 'HOLLYWOOD – 9 of 9 in the Mastering Karate Series – A MASTER GOES TO HOLLYWOOD

This is a fun and interesting inside look of Kancho''s time in Hollywood filming this series of DVDs.

Sold "AS-IS". Please check for availability before purchase.', 'dvds', 2995, null::int, '/DVD_RS-171Hollywood_small.webp', 100),
  ('interview-dvd', 'Interview DVD', 'INTERVIEW – 8 of 9 in the Mastering Karate Series

This DVD contains an interview with Kancho Kanazawa in which he speaks in depth about his life in karate.

Sold "AS-IS". Please check for availability before purchase.', 'dvds', 2995, 500, '/DVD_RS-170Interview_small.webp', 100),
  ('karate-fighting-techniques-by-h-kanazawa', 'Karate Fighting Techniques by H. Kanazawa', 'KARATE FIGHTING TECHNIQUES BY H. KANAZAWA, KANCHO
Translated by Richard Berger

This book is Kanazawa''s first, and the very first complete guide to kumite, or sparring. The karate training process comprises four areas: basics, kumite, kata (forms; prearranged movements and techniques), and competition. Kumite, "the art of grappling with opponents," as it might be called, is the key to success in karate tournaments. Karate Fighting Techniques teaches all the kumite techniques.

With almost 500 photos of the author and some rare photos of the late Gichin Funakoshi and his famous disciple Masatoshi Nakayama (author of the popular Best Karate series), Karate Fighting Techniques is an indispensable resource for all karate practitioners. — Kodansha Publications', 'books', 3000, null::int, '/karate_fighting_techniques_book.webp', 100),
  ('karate-my-life-by-h-kanazawa', 'Karate My Life by H. Kanazawa', 'KARATE MY LIFE BY H. KANAZAWA, KANCHO
Translated by Alex Bennett', 'books', 1800, null::int, '/karate_my_life_book.webp', 100),
  ('karate-the-complete-kata-by-h-kanazawa', 'Karate The Complete Kata by H. Kanazawa', 'In this comprehensive book, renowned karate master Hirokazu Kanazawa, founder of the Shotokan Karate-do International Federation and disciple of the legendary Gichin Funakoshi, the father of modern karate, traces the history of karate''s twenty-seven most important kata.

Combining detailed, step by step explanations with important historical contexts, Kanazawa meticulously maps out the distinct approaches to kata and the various branches of karate as it evolved from generation to generation. The author explains in depth some of the more difficult aspects of karate for learners to master, including steps, breathing, and pressure points. Kata needs to be practiced with disciplined, regular training on an individual basis, and this book is written with such training in mind.', 'books', 3000, null::int, '/karate_complete_kata_book.webp', 100),
  ('my-first-book-of-shotokan-karate', 'My First Book of Shotokan Karate', 'First Book of Shotokan Karate by one of our students. This is a great first karate book for children. It helps your child to understand where and how their style was developed and what they can expect to learn.', 'books', 300, null::int, '/my_first_book.webp', 100)
) as v(slug, name, descr, cat, price, sale, img, stock)
join public.categories c on c.slug = v.cat
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, category_id = excluded.category_id,
  price_cents = excluded.price_cents, sale_price_cents = excluded.sale_price_cents,
  image_url = excluded.image_url, stock = excluded.stock;

-- T-shirts: front/back photos, sizes and descriptions
update public.products set
  image_url = '/skif_usa_t_shirt_black_front_side.webp',
  images = array['/skif_usa_t_shirt_black_front_side.webp', '/skif_usa_t_shirt_black_back_side.webp'],
  sizes = array['Small','Medium','Large','X-Large','XX-Large'],
  description = $desc$BELLA + CANVAS TRI-BLEND T-SHIRT

* 3.5 oz. 50/25/25 polyester, pre-shrunk combed ringspun cotton, rayon tri-blend material
* Double-needle stitched for durability
* Silky smooth luxurious fabric
* Stretchy ribbed collar for comfort$desc$
where slug = 'skif-usa-t-shirt-black';

update public.products set
  image_url = '/skif_usa_t_shirt_white_front_side.webp',
  images = array['/skif_usa_t_shirt_white_front_side.webp', '/skif_usa_t_shirt_white_back_side.webp'],
  sizes = array['Small','Medium','Large','X-Large','XX-Large'],
  description = $desc$COMFORT 100% COTTON T-SHIRT

* 6.1 oz. 100% pre-shrunk, ringspun cotton
* Double-needle stitched for durability
* Super-Soft$desc$
where slug = 'skif-usa-t-shirt-white';

-- First seminar: Saturday Dec 5, 2026, 6:30 PM Eastern (23:30 UTC), 60 minutes, $25, members only. Edit seats/details in Admin > Events.
insert into public.products (slug, name, description, category_id, price_cents, image_url, stock, members_only, kind, event_start, event_minutes)
select
  'live-virtual-training-daizo-kanazawa-2026-12-05',
  'Live Virtual Training with Daizo Kanazawa Sensei',
  $desc$SKIF-USA LIVE VIRTUAL TRAINING WITH DAIZO KANAZAWA SENSEI FROM JAPAN HQ

The virtual training program with SKIF Japan Headquarters is back! We invite all SKIF-USA members to join a live online training session with Daizo Kanazawa, Sensei.

* 1-hour live training session
* Online via Zoom
* Limited spots, first come, first served. Register early to secure your place.
* Zoom access information will be emailed 6-12 hours before the event and shown in My account. Please do not share the meeting ID or password.
* Please warm up before the session and join 5 minutes early to allow time for setup and any technical issues.

Questions: skifusa@gmail.com | Ruben Fung: 832-513-0058 | skifusa.org

Train together. Learn together. Grow together.$desc$,
  c.id, 2500, '/seminar_live_training.webp', 50, true, 'virtual', '2026-12-05T23:30:00Z', 60
from public.categories c where c.slug = 'seminars'
on conflict (slug) do nothing;

insert into public.event_access (product_id)
select id from public.products where slug = 'live-virtual-training-daizo-kanazawa-2026-12-05'
on conflict do nothing;
