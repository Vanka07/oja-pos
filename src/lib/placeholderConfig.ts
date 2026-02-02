export interface PlaceholderConfig {
  productName: string;
  shopName: string;
  ownerName: string;
  customerName: string;
  catalogSlug: string;
  catalogDescription: string;
  address: string;
  categoryExample: string;
}

const placeholders: Record<string, PlaceholderConfig> = {
  supermarket: {
    productName: 'e.g. Indomie Chicken 70g',
    shopName: 'e.g. Alhaji Musa Supermarket',
    ownerName: 'e.g. Musa Abdullahi',
    customerName: 'e.g. Mama Ngozi',
    catalogSlug: 'e.g. alhaji-musa-store',
    catalogDescription: 'e.g. Your one-stop shop for groceries & household items',
    address: 'e.g. 15 Balogun Street, Lagos Island',
    categoryExample: 'e.g. Provisions, Drinks, Household',
  },
  salon: {
    productName: 'e.g. Box Braids',
    shopName: "e.g. Tunde's Barber Lounge",
    ownerName: 'e.g. Tunde Adeyemi',
    customerName: 'e.g. Mrs. Adebayo',
    catalogSlug: 'e.g. tundes-barber-lounge',
    catalogDescription: 'e.g. Premium hair styling and grooming services',
    address: 'e.g. 8 Allen Avenue, Ikeja',
    categoryExample: 'e.g. Hair Styling, Barbing, Skincare',
  },
  pharmacy: {
    productName: 'e.g. Paracetamol 500mg',
    shopName: 'e.g. GoodHealth Pharmacy',
    ownerName: 'e.g. Pharm. Chioma Eze',
    customerName: 'e.g. Alhaji Garba',
    catalogSlug: 'e.g. goodhealth-pharmacy',
    catalogDescription: 'e.g. Quality medicines and health products',
    address: 'e.g. 22 Awolowo Road, Ikoyi',
    categoryExample: 'e.g. Pain Relief, Vitamins, First Aid',
  },
  fashion: {
    productName: 'e.g. Ankara Fabric (1 yard)',
    shopName: "e.g. Amina's Boutique",
    ownerName: 'e.g. Amina Ibrahim',
    customerName: 'e.g. Sister Blessing',
    catalogSlug: 'e.g. aminas-boutique',
    catalogDescription: 'e.g. Stylish clothing, fabrics & accessories',
    address: 'e.g. Balogun Market, Lagos',
    categoryExample: 'e.g. Fabrics, Ready-to-Wear, Accessories',
  },
  restaurant: {
    productName: 'e.g. Jollof Rice & Chicken',
    shopName: "e.g. Mama Titi's Kitchen",
    ownerName: 'e.g. Titilayo Ogundimu',
    customerName: 'e.g. Brother Emeka',
    catalogSlug: 'e.g. mama-titis-kitchen',
    catalogDescription: 'e.g. Delicious homemade meals and snacks',
    address: 'e.g. 5 Stadium Road, Surulere',
    categoryExample: 'e.g. Rice Dishes, Soups, Drinks',
  },
  electronics: {
    productName: 'e.g. iPhone 15 Screen Protector',
    shopName: 'e.g. Obinna Tech Hub',
    ownerName: 'e.g. Obinna Nwankwo',
    customerName: 'e.g. Oga Segun',
    catalogSlug: 'e.g. obinna-tech-hub',
    catalogDescription: 'e.g. Phones, gadgets & accessories',
    address: 'e.g. Computer Village, Ikeja',
    categoryExample: 'e.g. Phones, Accessories, Gadgets',
  },
};

const defaultPlaceholders: PlaceholderConfig = {
  productName: 'e.g. Product Name',
  shopName: 'e.g. My Business Name',
  ownerName: 'e.g. Your Full Name',
  customerName: 'e.g. Customer Name',
  catalogSlug: 'e.g. my-business',
  catalogDescription: 'e.g. Tell customers what you sell',
  address: 'e.g. Shop address',
  categoryExample: 'e.g. Hair Products, Drinks, Electronics',
};

export function getPlaceholders(businessType: string | null): PlaceholderConfig {
  if (!businessType) return defaultPlaceholders;
  return placeholders[businessType] || defaultPlaceholders;
}
