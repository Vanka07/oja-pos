import type { Product, Category } from '@/store/retailStore';

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
const randomQty = () => Math.floor(Math.random() * 41) + 10; // 10-50
const now = () => new Date().toISOString();

function makeProduct(
  name: string,
  sellingPrice: number,
  category: string,
  unit = 'pcs'
): Omit<Product, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name,
    barcode: '',
    category,
    costPrice: Math.round(sellingPrice * 0.7),
    sellingPrice,
    quantity: randomQty(),
    unit,
    lowStockThreshold: 5,
  };
}

export interface BusinessTemplate {
  products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[];
  categories: Omit<Category, 'id'>[];
}

export const businessTemplates: Record<string, BusinessTemplate> = {
  supermarket: {
    categories: [
      { name: 'Food & Grains', color: '#F39C12', icon: '🌾' },
      { name: 'Beverages', color: '#E67E22', icon: '☕' },
      { name: 'Dairy', color: '#3498DB', icon: '🥛' },
      { name: 'Cooking', color: '#27AE60', icon: '🍳' },
      { name: 'Toiletries', color: '#9B59B6', icon: '🧴' },
      { name: 'Household', color: '#34495E', icon: '🏠' },
    ],
    products: [
      makeProduct('Rice (50kg)', 45000, 'Food & Grains', 'bag'),
      makeProduct('Indomie (Carton)', 5500, 'Food & Grains', 'carton'),
      makeProduct('Peak Milk', 2800, 'Dairy', 'tin'),
      makeProduct('Groundnut Oil (5L)', 8500, 'Cooking', 'keg'),
      makeProduct('Milo', 4200, 'Beverages', 'tin'),
      makeProduct('Sugar (10kg)', 3800, 'Food & Grains', 'bag'),
      makeProduct('Dettol', 950, 'Toiletries', 'pcs'),
      makeProduct('Golden Penny Spaghetti', 1200, 'Food & Grains', 'pack'),
      makeProduct('Dangote Flour (50kg)', 14000, 'Food & Grains', 'bag'),
      makeProduct('Bournvita', 3500, 'Beverages', 'tin'),
      makeProduct('Maggi (Pack)', 500, 'Cooking', 'pack'),
      makeProduct('Omo Detergent', 1800, 'Household', 'pcs'),
    ],
  },

  salon: {
    categories: [
      { name: 'Hair Services', color: '#E91E63', icon: '💇' },
      { name: 'Men\'s Services', color: '#2196F3', icon: '💈' },
      { name: 'Hair Products', color: '#9C27B0', icon: '🧴' },
      { name: 'Styling', color: '#FF9800', icon: '✨' },
    ],
    products: [
      makeProduct('Braids', 15000, 'Hair Services', 'pcs'),
      makeProduct('Relaxer Set', 2500, 'Hair Products', 'pcs'),
      makeProduct('Hair Extensions', 25000, 'Hair Services', 'pcs'),
      makeProduct('Wash & Set', 3000, 'Hair Services', 'pcs'),
      makeProduct('Men\'s Haircut', 1500, 'Men\'s Services', 'pcs'),
      makeProduct('Shave', 500, 'Men\'s Services', 'pcs'),
      makeProduct('Gel/Pomade', 1200, 'Hair Products', 'pcs'),
      makeProduct('Hair Treatment', 5000, 'Hair Services', 'pcs'),
      makeProduct('Cornrows', 8000, 'Styling', 'pcs'),
      makeProduct('Hair Dye', 3500, 'Hair Products', 'pcs'),
    ],
  },

  pharmacy: {
    categories: [
      { name: 'Pain Relief', color: '#F44336', icon: '💊' },
      { name: 'Antibiotics', color: '#4CAF50', icon: '🦠' },
      { name: 'Vitamins', color: '#FF9800', icon: '🍊' },
      { name: 'First Aid', color: '#2196F3', icon: '🩹' },
      { name: 'Hygiene', color: '#9C27B0', icon: '🧼' },
    ],
    products: [
      makeProduct('Paracetamol', 200, 'Pain Relief', 'pcs'),
      makeProduct('Amoxicillin', 1500, 'Antibiotics', 'pcs'),
      makeProduct('Vitamin C', 800, 'Vitamins', 'pcs'),
      makeProduct('Cough Syrup', 1200, 'Pain Relief', 'pcs'),
      makeProduct('Plaster/Band-Aid', 300, 'First Aid', 'pcs'),
      makeProduct('Hand Sanitizer', 500, 'Hygiene', 'pcs'),
      makeProduct('Blood Pressure Tablets', 2500, 'Antibiotics', 'pcs'),
      makeProduct('Malaria Test Kit', 1000, 'First Aid', 'pcs'),
      makeProduct('Ibuprofen', 350, 'Pain Relief', 'pcs'),
      makeProduct('ORS Sachets', 100, 'First Aid', 'pcs'),
    ],
  },

  fashion: {
    categories: [
      { name: 'Clothing', color: '#E91E63', icon: '👔' },
      { name: 'Fabrics', color: '#FF9800', icon: '🧵' },
      { name: 'Footwear', color: '#795548', icon: '👟' },
      { name: 'Accessories', color: '#9C27B0', icon: '💍' },
    ],
    products: [
      makeProduct('T-Shirt', 5000, 'Clothing', 'pcs'),
      makeProduct('Jeans', 12000, 'Clothing', 'pcs'),
      makeProduct('Ankara Fabric (yard)', 3500, 'Fabrics', 'yard'),
      makeProduct('Shoes', 15000, 'Footwear', 'pair'),
      makeProduct('Bags', 8000, 'Accessories', 'pcs'),
      makeProduct('Accessories/Jewelry', 2500, 'Accessories', 'pcs'),
      makeProduct('Agbada Set', 35000, 'Clothing', 'pcs'),
      makeProduct('Cap', 3000, 'Accessories', 'pcs'),
      makeProduct('Belt', 2000, 'Accessories', 'pcs'),
      makeProduct('Underwear Pack', 4500, 'Clothing', 'pack'),
    ],
  },

  restaurant: {
    categories: [
      { name: 'Rice Dishes', color: '#FF9800', icon: '🍚' },
      { name: 'Swallow', color: '#795548', icon: '🍲' },
      { name: 'Soups', color: '#4CAF50', icon: '🥘' },
      { name: 'Grills & Snacks', color: '#F44336', icon: '🍖' },
      { name: 'Drinks', color: '#2196F3', icon: '🥤' },
    ],
    products: [
      makeProduct('Jollof Rice', 1500, 'Rice Dishes', 'plate'),
      makeProduct('Fried Rice', 1500, 'Rice Dishes', 'plate'),
      makeProduct('Amala & Ewedu', 800, 'Swallow', 'plate'),
      makeProduct('Pepper Soup', 2500, 'Soups', 'bowl'),
      makeProduct('Suya', 1000, 'Grills & Snacks', 'pcs'),
      makeProduct('Shawarma', 2000, 'Grills & Snacks', 'pcs'),
      makeProduct('Pounded Yam', 1200, 'Swallow', 'plate'),
      makeProduct('Egusi Soup', 1000, 'Soups', 'bowl'),
      makeProduct('Meat Pie', 500, 'Grills & Snacks', 'pcs'),
      makeProduct('Soft Drink', 300, 'Drinks', 'bottle'),
    ],
  },

  electronics: {
    categories: [
      { name: 'Phone Accessories', color: '#2196F3', icon: '📱' },
      { name: 'Audio', color: '#9C27B0', icon: '🎧' },
      { name: 'Cables & Chargers', color: '#FF9800', icon: '🔌' },
      { name: 'Storage & Power', color: '#4CAF50', icon: '🔋' },
    ],
    products: [
      makeProduct('iPhone Screen Protector', 2000, 'Phone Accessories', 'pcs'),
      makeProduct('Samsung Charger', 3500, 'Cables & Chargers', 'pcs'),
      makeProduct('Airpods', 8000, 'Audio', 'pcs'),
      makeProduct('USB Cable', 1500, 'Cables & Chargers', 'pcs'),
      makeProduct('Phone Case', 2500, 'Phone Accessories', 'pcs'),
      makeProduct('Bluetooth Speaker', 12000, 'Audio', 'pcs'),
      makeProduct('Power Bank', 7000, 'Storage & Power', 'pcs'),
      makeProduct('Earpiece', 500, 'Audio', 'pcs'),
      makeProduct('Memory Card', 3000, 'Storage & Power', 'pcs'),
      makeProduct('Laptop Charger', 8000, 'Cables & Chargers', 'pcs'),
    ],
  },

  other: {
    categories: [
      { name: 'General', color: '#E67E22', icon: '📦' },
      { name: 'Services', color: '#3498DB', icon: '✨' },
      { name: 'Other', color: '#9B59B6', icon: '🏷️' },
    ],
    products: [],
  },
};
