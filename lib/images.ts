// Category artwork in /public, used on category tiles and as a product image fallback.
export const categoryImage: Record<string, string> = {
  dvds: "/skif_dvds.webp",
  books: "/skif_books.webp",
  accessories: "/skif_accessories.webp",
  members: "/skif_membership.webp",
};

export const productImage = (p: { image_url: string | null; categories: { slug: string } | null }) =>
  p.image_url ?? (p.categories ? categoryImage[p.categories.slug] : undefined) ?? null;
