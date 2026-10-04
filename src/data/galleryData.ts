export interface GalleryItem {
  id: string;
  title: string;
  category: 'cakes' | 'bakery' | 'food' | 'ambiance';
  image: string;
}

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'gal-1',
    title: 'Artisan Chocolate Truffle Cake',
    category: 'cakes',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'gal-2',
    title: 'Woodfired Farmhouse Pizza',
    category: 'food',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'gal-3',
    title: 'Freshly Baked Croissants & Buns',
    category: 'bakery',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'gal-4',
    title: 'Creamy White Sauce Pasta',
    category: 'food',
    image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'gal-5',
    title: 'Classic Red Velvet Cake Slice',
    category: 'cakes',
    image: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'gal-6',
    title: 'Cozy Bistro Dining Atmosphere',
    category: 'ambiance',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'gal-7',
    title: 'Gourmet Double Patty Veg Burger',
    category: 'food',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'gal-8',
    title: 'Custom 2-Tier Celebration Cake',
    category: 'cakes',
    image: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'gal-9',
    title: 'Peri Peri Crisp French Fries',
    category: 'food',
    image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'gal-10',
    title: 'Artisan Pastry Counter',
    category: 'bakery',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'gal-11',
    title: 'Refreshing Thick Shakes & Drinks',
    category: 'food',
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'gal-12',
    title: 'Warm & Inviting Café Corner',
    category: 'ambiance',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
  },
];
