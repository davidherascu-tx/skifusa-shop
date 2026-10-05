-- Image gallery + size options for products, and a size on each order line.
alter table public.products add column if not exists images text[] not null default '{}';
alter table public.products add column if not exists sizes  text[] not null default '{}';
alter table public.order_items add column if not exists size text;

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
