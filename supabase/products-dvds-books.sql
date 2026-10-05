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
