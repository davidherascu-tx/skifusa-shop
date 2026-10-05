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
