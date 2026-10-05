insert into public.categories (slug, name, sort_order) values
  ('dvds','DVDs',1), ('books','Books',2), ('accessories','Accessories',3), ('members','S.K.I.F. Members',4)
on conflict do nothing;

insert into public.products (slug, name, description, category_id, price_cents, sale_price_cents, stock, members_only)
select v.slug, v.name, v.descr, c.id, v.price, v.sale, 100, v.mem
from (values
  ('26-karate-kata-dvd','26 Karate Kata','Instructional DVD covering 26 Shotokan kata.','dvds',2995,null::int,false),
  ('dan-kata-dvd','Dan-Kata DVD','Kata for dan grades.','dvds',2995,500,false),
  ('kanazawa-fighting-techniques','Fighting Techniques (H. Kanazawa)','Kumite and fighting techniques.','books',3000,null,false),
  ('kanazawa-autobiography','Autobiography (H. Kanazawa)','The life of Hirokazu Kanazawa.','books',1800,null,false),
  ('skif-patch','S.K.I.F. Patch','Official embroidered patch.','accessories',800,null,false)
) as v(slug,name,descr,cat,price,sale,mem)
join public.categories c on c.slug = v.cat
on conflict do nothing;
