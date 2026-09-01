export const initialCafeSettings = {
  cafeName: "Dinenos Coffee House & Bistro",
  tagline: "Artisanal Coffee & Gourmet Bistro",
  logo: "https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/02/dineos-logo-white.svg",
  address: "12 Creek Street, Brisbane CBD, Australia",
  phone: "+61 (07) 3892 4100",
  email: "contact@dinenoscafe.com",
  website: "https://dinenoscafe.com",
  currency: "₹",
  currencyCode: "INR",
  taxRate: 5.0, // 5% GST
  taxNumber: "GSTIN-29AABCU9603R1ZM",
  serviceChargeRate: 2.5,
  loyaltyPointsPerHundred: 1, // 1 point per 100 spent
  loyaltyPointRedemptionValue: 1, // 1 point = 1 currency unit
  minPointsToRedeem: 50,
  invoicePrefix: "DIN-",
  invoiceFooterMessage: "Thank you for visiting Dinenos! Rate us on Google for 50 bonus loyalty points.",
  enableCouponStacking: false,
  autoPrintReceipt: true,
  openingHours: "Mon - Sun: 7:00 AM – 11:00 PM",
  lowStockThresholdDefault: 5
};

export const initialCategories = [
  { id: "cat-1", name: "Hot Coffee", slug: "hot-coffee", icon: "Coffee", color: "#DD5903", itemCount: 6, isActive: true },
  { id: "cat-2", name: "Cold Brew & Iced", slug: "cold-brew", icon: "CupSoda", color: "#3B82F6", itemCount: 4, isActive: true },
  { id: "cat-3", name: "Artisanal Teas", slug: "teas", icon: "Leaf", color: "#10B981", itemCount: 3, isActive: true },
  { id: "cat-4", name: "Breakfast & Bakery", slug: "breakfast", icon: "Croissant", color: "#F59E0B", itemCount: 4, isActive: true },
  { id: "cat-5", name: "Gourmet Burgers & Sandwiches", slug: "sandwiches", icon: "Sandwich", color: "#EC4899", itemCount: 4, isActive: true },
  { id: "cat-6", name: "Wood-Fired Pizza", slug: "pizza", icon: "Pizza", color: "#EF4444", itemCount: 3, isActive: true },
  { id: "cat-7", name: "Desserts & Pastries", slug: "desserts", icon: "Cake", color: "#8B5CF6", itemCount: 3, isActive: true }
];

export const initialAddons = [
  { id: "add-1", name: "Extra Espresso Shot", price: 40, category: "Coffee", isAvailable: true },
  { id: "add-2", name: "Oat Milk Upgrade", price: 50, category: "Milk", isAvailable: true },
  { id: "add-3", name: "Almond Milk Upgrade", price: 50, category: "Milk", isAvailable: true },
  { id: "add-4", name: "Vanilla / Caramel Syrup", price: 35, category: "Flavour", isAvailable: true },
  { id: "add-5", name: "Whipped Cream", price: 30, category: "Topping", isAvailable: true },
  { id: "add-6", name: "Extra Cheddar Cheese", price: 45, category: "Food", isAvailable: true },
  { id: "add-7", name: "Truffle Mayo Dip", price: 40, category: "Food", isAvailable: true }
];

export const initialProducts = [
  {
    id: "prod-1",
    name: "Classic Latte",
    category: "cat-1",
    description: "Double shot of rich espresso topped with silky smooth steamed milk and subtle latte art.",
    costPrice: 45,
    sellingPrice: 180,
    isVeg: true,
    prepTimeMinutes: 5,
    isAvailable: true,
    isFeatured: true,
    image: "https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/latte.jpg",
    variants: [
      { id: "var-1-1", name: "Regular (250ml)", priceDelta: 0, isDefault: true },
      { id: "var-1-2", name: "Large (350ml)", priceDelta: 40, isDefault: false }
    ],
    allowedAddons: ["add-1", "add-2", "add-3", "add-4", "add-5"],
    inventoryIngredients: [{ ingredientId: "inv-1", quantity: 0.02 }, { ingredientId: "inv-2", quantity: 0.2 }]
  },
  {
    id: "prod-2",
    name: "Cappuccino Italiano",
    category: "cat-1",
    description: "Traditional 1:1:1 balanced ratio of dark espresso, velvety steamed milk, and dense microfoam.",
    costPrice: 40,
    sellingPrice: 190,
    isVeg: true,
    prepTimeMinutes: 5,
    isAvailable: true,
    isFeatured: true,
    image: "https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/Cappuccino.jpg",
    variants: [
      { id: "var-2-1", name: "Regular", priceDelta: 0, isDefault: true },
      { id: "var-2-2", name: "Large", priceDelta: 45, isDefault: false }
    ],
    allowedAddons: ["add-1", "add-2", "add-3", "add-4", "add-5"],
    inventoryIngredients: [{ ingredientId: "inv-1", quantity: 0.02 }, { ingredientId: "inv-2", quantity: 0.18 }]
  },
  {
    id: "prod-3",
    name: "Single-Origin Americano",
    category: "cat-1",
    description: "Double extraction of single-origin Colombian beans poured over crisp purified hot water.",
    costPrice: 25,
    sellingPrice: 140,
    isVeg: true,
    prepTimeMinutes: 3,
    isAvailable: true,
    isFeatured: false,
    image: "https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/Americano.jpg",
    variants: [
      { id: "var-3-1", name: "Standard (200ml)", priceDelta: 0, isDefault: true },
      { id: "var-3-2", name: "Grande (350ml)", priceDelta: 30, isDefault: false }
    ],
    allowedAddons: ["add-1", "add-4"],
    inventoryIngredients: [{ ingredientId: "inv-1", quantity: 0.025 }]
  },
  {
    id: "prod-4",
    name: "Pure Espresso Doppio",
    category: "cat-1",
    description: "Two concentrated shots of high-altitude roasted arabica beans with thick hazelnut crema.",
    costPrice: 20,
    sellingPrice: 120,
    isVeg: true,
    prepTimeMinutes: 2,
    isAvailable: true,
    isFeatured: false,
    image: "https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/Espresso-1.jpg",
    variants: [
      { id: "var-4-1", name: "Doppio (60ml)", priceDelta: 0, isDefault: true }
    ],
    allowedAddons: ["add-1"],
    inventoryIngredients: [{ ingredientId: "inv-1", quantity: 0.022 }]
  },
  {
    id: "prod-5",
    name: "Nitro Cold Brew",
    category: "cat-2",
    description: "Steeped for 24 hours in cold filtered water and nitrogen-infused for a creamy stout-like texture.",
    costPrice: 50,
    sellingPrice: 220,
    isVeg: true,
    prepTimeMinutes: 2,
    isAvailable: true,
    isFeatured: true,
    image: "https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/Americano.jpg",
    variants: [
      { id: "var-5-1", name: "Regular (300ml)", priceDelta: 0, isDefault: true },
      { id: "var-5-2", name: "Large (450ml)", priceDelta: 50, isDefault: false }
    ],
    allowedAddons: ["add-4", "add-5"],
    inventoryIngredients: [{ ingredientId: "inv-1", quantity: 0.04 }]
  },
  {
    id: "prod-6",
    name: "Iced Caramel Macchiato",
    category: "cat-2",
    description: "Chilled milk and fragrant vanilla syrup marked with bold espresso and dripping caramel drizzle.",
    costPrice: 55,
    sellingPrice: 240,
    isVeg: true,
    prepTimeMinutes: 4,
    isAvailable: true,
    isFeatured: true,
    image: "https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/Galao.jpg",
    variants: [
      { id: "var-6-1", name: "Regular", priceDelta: 0, isDefault: true },
      { id: "var-6-2", name: "Large", priceDelta: 45, isDefault: false }
    ],
    allowedAddons: ["add-1", "add-2", "add-3", "add-5"],
    inventoryIngredients: [{ ingredientId: "inv-1", quantity: 0.02 }, { ingredientId: "inv-2", quantity: 0.22 }]
  },
  {
    id: "prod-7",
    name: "Royal Earl Grey Lavender Tea",
    category: "cat-3",
    description: "Premium whole-leaf black tea scented with cold-pressed bergamot oil and organic French lavender buds.",
    costPrice: 30,
    sellingPrice: 160,
    isVeg: true,
    prepTimeMinutes: 4,
    isAvailable: true,
    isFeatured: false,
    image: "https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/latte.jpg",
    variants: [
      { id: "var-7-1", name: "Pot for One", priceDelta: 0, isDefault: true },
      { id: "var-7-2", name: "Pot for Two", priceDelta: 80, isDefault: false }
    ],
    allowedAddons: [],
    inventoryIngredients: [{ ingredientId: "inv-7", quantity: 0.015 }]
  },
  {
    id: "prod-8",
    name: "Butter Croissant with Preserves",
    category: "cat-4",
    description: "Flaky 32-layer French butter croissant baked fresh daily, served with whipped butter and berry jam.",
    costPrice: 40,
    sellingPrice: 150,
    isVeg: true,
    prepTimeMinutes: 3,
    isAvailable: true,
    isFeatured: true,
    image: "https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/02/gallery-3.jpg",
    variants: [{ id: "var-8-1", name: "1 Piece", priceDelta: 0, isDefault: true }],
    allowedAddons: ["add-6"],
    inventoryIngredients: [{ ingredientId: "inv-10", quantity: 0.05 }]
  },
  {
    id: "prod-9",
    name: "Avocado Sourdough Toast",
    category: "cat-4",
    description: "Toasted artisan sourdough topped with smashed Hass avocado, cherry tomatoes, feta, and pumpkin seeds.",
    costPrice: 90,
    sellingPrice: 320,
    isVeg: true,
    prepTimeMinutes: 8,
    isAvailable: true,
    isFeatured: true,
    image: "https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/02/gallery-3.jpg",
    variants: [{ id: "var-9-1", name: "Standard", priceDelta: 0, isDefault: true }],
    allowedAddons: ["add-6"],
    inventoryIngredients: [{ ingredientId: "inv-9", quantity: 0.15 }, { ingredientId: "inv-8", quantity: 0.04 }]
  },
  {
    id: "prod-10",
    name: "Smoked Chicken Ciabatta",
    category: "cat-5",
    description: "Herb-marinated smoked chicken breast, aged cheddar, arugula, and grain mustard on crispy ciabatta.",
    costPrice: 110,
    sellingPrice: 340,
    isVeg: false,
    prepTimeMinutes: 10,
    isAvailable: true,
    isFeatured: true,
    image: "https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/4.webp",
    variants: [{ id: "var-10-1", name: "Standard Sandwich", priceDelta: 0, isDefault: true }],
    allowedAddons: ["add-6", "add-7"],
    inventoryIngredients: [{ ingredientId: "inv-8", quantity: 0.05 }, { ingredientId: "inv-9", quantity: 0.15 }]
  },
  {
    id: "prod-11",
    name: "Truffle Mushroom Artisan Pizza",
    category: "cat-6",
    description: "Neapolitan hand-stretched sourdough crust, wild forest mushrooms, fior di latte mozzarella, truffle oil.",
    costPrice: 140,
    sellingPrice: 460,
    isVeg: true,
    prepTimeMinutes: 14,
    isAvailable: true,
    isFeatured: true,
    image: "https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/1.webp",
    variants: [
      { id: "var-11-1", name: "Medium 10 inch", priceDelta: 0, isDefault: true },
      { id: "var-11-2", name: "Large 12 inch", priceDelta: 120, isDefault: false }
    ],
    allowedAddons: ["add-6", "add-7"],
    inventoryIngredients: [{ ingredientId: "inv-11", quantity: 1 }, { ingredientId: "inv-8", quantity: 0.12 }]
  },
  {
    id: "prod-12",
    name: "Classic Tiramisu al Mascarpone",
    category: "cat-7",
    description: "Italian ladyfingers soaked in Dinenos espresso, layered with creamy whipped mascarpone and dark cocoa.",
    costPrice: 85,
    sellingPrice: 280,
    isVeg: true,
    prepTimeMinutes: 2,
    isAvailable: true,
    isFeatured: true,
    image: "https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/3.webp",
    variants: [{ id: "var-12-1", name: "1 Slice", priceDelta: 0, isDefault: true }],
    allowedAddons: ["add-5"],
    inventoryIngredients: [{ ingredientId: "inv-1", quantity: 0.015 }]
  }
];

export const initialTables = [
  { id: "tbl-1", tableNumber: "T-01", zone: "Indoor Cafe", capacity: 2, status: "Occupied", currentOrderId: "ord-101", customerName: "Rahul Sharma", x: 1, y: 1 },
  { id: "tbl-2", tableNumber: "T-02", zone: "Indoor Cafe", capacity: 4, status: "Available", currentOrderId: null, customerName: null, x: 2, y: 1 },
  { id: "tbl-3", tableNumber: "T-03", zone: "Indoor Cafe", capacity: 4, status: "Reserved", currentOrderId: null, customerName: "Priya Nair", x: 3, y: 1 },
  { id: "tbl-4", tableNumber: "T-04", zone: "Indoor Cafe", capacity: 6, status: "Available", currentOrderId: null, customerName: null, x: 4, y: 1 },
  { id: "tbl-5", tableNumber: "T-05", zone: "Garden Terrace", capacity: 2, status: "Available", currentOrderId: null, customerName: null, x: 1, y: 2 },
  { id: "tbl-6", tableNumber: "T-06", zone: "Garden Terrace", capacity: 4, status: "Occupied", currentOrderId: "ord-102", customerName: "Ananya Iyer", x: 2, y: 2 },
  { id: "tbl-7", tableNumber: "T-07", zone: "Garden Terrace", capacity: 4, status: "Cleaning", currentOrderId: null, customerName: null, x: 3, y: 2 },
  { id: "tbl-8", tableNumber: "T-08", zone: "Garden Terrace", capacity: 8, status: "Available", currentOrderId: null, customerName: null, x: 4, y: 2 }
];

export const initialCustomers = [
  {
    id: "cust-1",
    name: "Rahul Sharma",
    phone: "+91 98450 11223",
    email: "rahul.sharma@example.com",
    tier: "Platinum",
    loyaltyPoints: 340,
    totalSpent: 12450,
    totalOrders: 28,
    lastVisit: "2026-09-01T16:30:00Z",
    favoriteProducts: ["Classic Latte", "Avocado Sourdough Toast"],
    notes: "Prefers oat milk in hot drinks. Regular weekday morning visitor."
  },
  {
    id: "cust-2",
    name: "Ananya Iyer",
    phone: "+91 97412 33445",
    email: "ananya.iyer@example.com",
    tier: "Gold",
    loyaltyPoints: 180,
    totalSpent: 6820,
    totalOrders: 14,
    lastVisit: "2026-09-01T15:15:00Z",
    favoriteProducts: ["Cappuccino Italiano", "Butter Croissant with Preserves"],
    notes: "Allergic to walnuts."
  },
  {
    id: "cust-3",
    name: "Vikram Malhotra",
    phone: "+91 99160 55667",
    email: "vikram.m@example.com",
    tier: "Silver",
    loyaltyPoints: 95,
    totalSpent: 3950,
    totalOrders: 8,
    lastVisit: "2026-08-30T11:20:00Z",
    favoriteProducts: ["Nitro Cold Brew", "Smoked Chicken Ciabatta"],
    notes: "Likes outdoor seating."
  },
  {
    id: "cust-4",
    name: "Priya Nair",
    phone: "+91 98860 77889",
    email: "priya.nair@example.com",
    tier: "Bronze",
    loyaltyPoints: 40,
    totalSpent: 1420,
    totalOrders: 3,
    lastVisit: "2026-08-28T18:00:00Z",
    favoriteProducts: ["Royal Earl Grey Lavender Tea"],
    notes: "New resident in the neighbourhood."
  },
  {
    id: "cust-5",
    name: "Siddharth Sen",
    phone: "+91 99001 88990",
    email: "sid.sen@example.com",
    tier: "Bronze",
    loyaltyPoints: 15,
    totalSpent: 650,
    totalOrders: 1,
    lastVisit: "2026-09-01T14:10:00Z",
    favoriteProducts: ["Single-Origin Americano"],
    notes: "First order via POS takeaway."
  }
];

export const initialCoupons = [
  {
    id: "cpn-1",
    code: "WELCOME50",
    name: "New Guest Special",
    description: "50% instant discount up to ₹150 for new coffee lovers.",
    discountType: "percentage",
    discountValue: 50,
    maxDiscount: 150,
    minOrderValue: 299,
    maxOrderValue: null,
    startDate: "2026-01-01",
    expiryDate: "2026-12-31",
    usageLimit: 500,
    usedCount: 142,
    perCustomerLimit: 1,
    status: "active",
    applicableCategories: [],
    applicableOrderTypes: ["dine-in", "takeaway", "delivery"],
    customerEligibility: "new",
    totalDiscountGiven: 17750,
    revenueGenerated: 64200
  },
  {
    id: "cpn-2",
    code: "DINENOS20",
    name: "Celebration 20% Off",
    description: "Flat 20% discount on orders above ₹400 across all menu items.",
    discountType: "percentage",
    discountValue: 20,
    maxDiscount: 200,
    minOrderValue: 400,
    maxOrderValue: null,
    startDate: "2026-08-01",
    expiryDate: "2026-09-30",
    usageLimit: 300,
    usedCount: 88,
    perCustomerLimit: 3,
    status: "active",
    applicableCategories: [],
    applicableOrderTypes: ["dine-in", "takeaway", "delivery"],
    customerEligibility: "all",
    totalDiscountGiven: 12320,
    revenueGenerated: 61600
  },
  {
    id: "cpn-3",
    code: "COFFEE50",
    name: "Flat ₹50 Coffee Treat",
    description: "Instant ₹50 deduction on minimum order value of ₹250.",
    discountType: "fixed",
    discountValue: 50,
    maxDiscount: 50,
    minOrderValue: 250,
    maxOrderValue: null,
    startDate: "2026-08-15",
    expiryDate: "2026-09-15",
    usageLimit: 200,
    usedCount: 65,
    perCustomerLimit: 2,
    status: "active",
    applicableCategories: ["cat-1", "cat-2"],
    applicableOrderTypes: ["dine-in", "takeaway"],
    customerEligibility: "all",
    totalDiscountGiven: 3250,
    revenueGenerated: 21450
  },
  {
    id: "cpn-4",
    code: "SUMMER99",
    name: "Summer Cold Brew Fest",
    description: "Special seasonal promotion expired last month.",
    discountType: "fixed",
    discountValue: 99,
    maxDiscount: 99,
    minOrderValue: 350,
    maxOrderValue: null,
    startDate: "2026-06-01",
    expiryDate: "2026-08-01",
    usageLimit: 100,
    usedCount: 100,
    perCustomerLimit: 1,
    status: "expired",
    applicableCategories: ["cat-2"],
    applicableOrderTypes: ["dine-in", "takeaway"],
    customerEligibility: "all",
    totalDiscountGiven: 9900,
    revenueGenerated: 42000
  }
];

export const initialInventory = [
  { id: "inv-1", name: "Arabica Coffee Beans (Single Origin)", category: "Raw Material", unit: "KG", currentStock: 8.5, minStock: 5.0, maxStock: 25.0, costPerUnit: 1200, supplierId: "sup-1", expiryDate: "2027-03-15", status: "In Stock" },
  { id: "inv-2", name: "Fresh Full Cream Milk", category: "Dairy", unit: "Litre", currentStock: 3.2, minStock: 10.0, maxStock: 40.0, costPerUnit: 68, supplierId: "sup-2", expiryDate: "2026-09-04", status: "Low Stock" },
  { id: "inv-3", name: "Organic Oat Milk", category: "Dairy Alternative", unit: "Litre", currentStock: 12.0, minStock: 5.0, maxStock: 20.0, costPerUnit: 180, supplierId: "sup-2", expiryDate: "2026-11-20", status: "In Stock" },
  { id: "inv-4", name: "Almond Barista Milk", category: "Dairy Alternative", unit: "Litre", currentStock: 6.5, minStock: 4.0, maxStock: 15.0, costPerUnit: 195, supplierId: "sup-2", expiryDate: "2026-11-15", status: "In Stock" },
  { id: "inv-5", name: "Valrhona Dark Cocoa Powder", category: "Dry Goods", unit: "KG", currentStock: 3.0, minStock: 2.0, maxStock: 10.0, costPerUnit: 1450, supplierId: "sup-1", expiryDate: "2027-06-30", status: "In Stock" },
  { id: "inv-6", name: "Organic Cane Sugar", category: "Sweeteners", unit: "KG", currentStock: 18.0, minStock: 8.0, maxStock: 50.0, costPerUnit: 52, supplierId: "sup-3", expiryDate: "2027-09-01", status: "In Stock" },
  { id: "inv-7", name: "Earl Grey Tea Leaves", category: "Raw Material", unit: "KG", currentStock: 2.1, minStock: 1.5, maxStock: 8.0, costPerUnit: 1800, supplierId: "sup-1", expiryDate: "2027-05-10", status: "In Stock" },
  { id: "inv-8", name: "Mozzarella & Cheddar Cheese Blend", category: "Dairy", unit: "KG", currentStock: 4.8, minStock: 4.0, maxStock: 15.0, costPerUnit: 480, supplierId: "sup-2", expiryDate: "2026-09-25", status: "In Stock" },
  { id: "inv-9", name: "Artisan Sourdough Bread Loaves", category: "Bakery", unit: "Loaf", currentStock: 2.0, minStock: 5.0, maxStock: 20.0, costPerUnit: 120, supplierId: "sup-3", expiryDate: "2026-09-03", status: "Low Stock" },
  { id: "inv-10", name: "French Unsalted Butter", category: "Dairy", unit: "KG", currentStock: 5.5, minStock: 3.0, maxStock: 15.0, costPerUnit: 620, supplierId: "sup-2", expiryDate: "2026-10-15", status: "In Stock" },
  { id: "inv-11", name: "Neapolitan Pizza Dough Balls", category: "Bakery", unit: "PCS", currentStock: 18.0, minStock: 10.0, maxStock: 50.0, costPerUnit: 45, supplierId: "sup-3", expiryDate: "2026-09-05", status: "In Stock" },
  { id: "inv-12", name: "Eco Kraft Takeaway Cups (350ml)", category: "Packaging", unit: "PCS", currentStock: 380, minStock: 150, maxStock: 1000, costPerUnit: 6.5, supplierId: "sup-4", expiryDate: "2029-01-01", status: "In Stock" }
];

export const initialSuppliers = [
  { id: "sup-1", name: "Origin Coffee & Tea Imports", contactPerson: "Marco Bianchi", phone: "+91 98200 44556", email: "orders@originimports.com", address: "Dockland Estate, Warehouse 4B, Mumbai", category: "Coffee, Tea & Cocoa", paymentTerms: "Net 15 Days", totalPurchases: 145000, status: "Active" },
  { id: "sup-2", name: "Highland Dairy Farms Co.", contactPerson: "Anita Deshmukh", phone: "+91 98400 66778", email: "sales@highlanddairy.in", address: "Farm Route 7, Pune Outskirts", category: "Fresh Milk, Cheese & Butter", paymentTerms: "Weekly on Monday", totalPurchases: 82400, status: "Active" },
  { id: "sup-3", name: "Artisan Bakers Supply Co.", contactPerson: "Kavita Rao", phone: "+91 99000 88991", email: "kavita@artisanbakers.com", address: "Industrial Zone 2, Bengaluru", category: "Sourdough, Dough & Flours", paymentTerms: "Cash on Delivery", totalPurchases: 49500, status: "Active" },
  { id: "sup-4", name: "EcoPack Sustainable Packaging", contactPerson: "Sanjay Verma", phone: "+91 98111 22334", email: "info@ecopack.co", address: "Packaging Hub, Sector 18, Gurugram", category: "Bio Cups, Straws, Boxes", paymentTerms: "Net 30 Days", totalPurchases: 31200, status: "Active" }
];

export const initialPurchases = [
  {
    id: "po-101",
    poNumber: "PO-2026-089",
    supplierId: "sup-1",
    supplierName: "Origin Coffee & Tea Imports",
    orderDate: "2026-08-25",
    receivedDate: "2026-08-27",
    totalAmount: 24000,
    paymentStatus: "Paid",
    status: "Completed",
    notes: "20 KG Arabica beans delivered in pristine condition.",
    items: [{ ingredientId: "inv-1", name: "Arabica Coffee Beans", quantity: 20, unitCost: 1200, totalCost: 24000 }]
  },
  {
    id: "po-102",
    poNumber: "PO-2026-092",
    supplierId: "sup-2",
    supplierName: "Highland Dairy Farms Co.",
    orderDate: "2026-08-30",
    receivedDate: "2026-08-31",
    totalAmount: 6800,
    paymentStatus: "Paid",
    status: "Completed",
    notes: "Fresh weekly milk and cheese batch.",
    items: [
      { ingredientId: "inv-2", name: "Fresh Full Cream Milk", quantity: 50, unitCost: 68, totalCost: 3400 },
      { ingredientId: "inv-8", name: "Cheese Blend", quantity: 7.08, unitCost: 480, totalCost: 3400 }
    ]
  }
];

export const initialExpenses = [
  { id: "exp-1", title: "Cafe Monthly Rent - Ground Floor", category: "Rent", amount: 45000, date: "2026-09-01", paymentMethod: "Online Bank Transfer", referenceNo: "NEFT-89320184", notes: "Monthly property rent paid to landlord.", loggedBy: "Alex Walker (Admin)" },
  { id: "exp-2", title: "Commercial Electricity Bill - August", category: "Electricity", amount: 8420, date: "2026-09-01", paymentMethod: "UPI", referenceNo: "UPI-481920391", notes: "Grid power consumption for roaster and AC units.", loggedBy: "Alex Walker (Admin)" },
  { id: "exp-3", title: "Barista & Kitchen Staff Salaries", category: "Salary", amount: 62000, date: "2026-08-31", paymentMethod: "Online Bank Transfer", referenceNo: "SAL-AUG-2026", notes: "August payroll for 5 team members.", loggedBy: "Alex Walker (Admin)" },
  { id: "exp-4", title: "Espresso Machine Maintenance & Descaling", category: "Maintenance", amount: 3500, date: "2026-08-28", paymentMethod: "Card", referenceNo: "POS-SERV-1092", notes: "La Marzocco group head gasket replacement and water filter check.", loggedBy: "Samantha Reed (Manager)" },
  { id: "exp-5", title: "Instagram Local Ads Campaign", category: "Marketing", amount: 2500, date: "2026-08-25", paymentMethod: "Card", referenceNo: "META-ADS-9021", notes: "Targeted Brisbane CBD coffee enthusiasts.", loggedBy: "Samantha Reed (Manager)" }
];

export const initialStaff = [
  { id: "staff-1", name: "Alex Walker", email: "admin@dinenos.com", phone: "+61 400 111 222", role: "Admin", status: "Active", joiningDate: "2022-01-15", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
  { id: "staff-2", name: "Samantha Reed", email: "manager@dinenos.com", phone: "+61 400 222 333", role: "Manager", status: "Active", joiningDate: "2023-03-01", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80" },
  { id: "staff-3", name: "David Chen", email: "cashier@dinenos.com", phone: "+61 400 333 444", role: "Cashier", status: "Active", joiningDate: "2024-02-10", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
  { id: "staff-4", name: "Gordon Marco", email: "kitchen@dinenos.com", phone: "+61 400 444 555", role: "Kitchen Staff", status: "Active", joiningDate: "2023-06-20", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" },
  { id: "staff-5", name: "Elena Silva", email: "waiter@dinenos.com", phone: "+61 400 555 666", role: "Waiter", status: "Active", joiningDate: "2024-05-12", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" }
];

export const initialReservations = [
  { id: "res-1", customerName: "Priya Nair", phone: "+91 98860 77889", email: "priya.nair@example.com", date: "2026-09-01", time: "18:00", guests: 4, tableId: "tbl-3", tableNumber: "T-03", status: "Confirmed", specialRequest: "Window side birthday setup with extra napkins.", createdAt: "2026-09-01T10:12:00Z" },
  { id: "res-2", customerName: "Marcus Thorne", phone: "+61 422 998 877", email: "marcus@thorne.com", date: "2026-09-01", time: "19:30", guests: 6, tableId: "tbl-4", tableNumber: "T-04", status: "Pending", specialRequest: "Quiet booth for business discussion.", createdAt: "2026-09-01T12:45:00Z" },
  { id: "res-3", customerName: "Clara Oswald", phone: "+61 433 112 244", email: "clara@oswald.com", date: "2026-09-02", time: "11:00", guests: 2, tableId: "tbl-5", tableNumber: "T-05", status: "Confirmed", specialRequest: "Outdoor terrace table.", createdAt: "2026-09-01T14:20:00Z" }
];

export const initialOrders = [
  {
    id: "ord-101",
    orderNumber: "DIN-8021",
    orderType: "dine-in",
    tableNumber: "T-01",
    tableId: "tbl-1",
    customerId: "cust-1",
    customerName: "Rahul Sharma",
    customerPhone: "+91 98450 11223",
    status: "Preparing", // New, Accepted, Preparing, Ready, Completed, Cancelled, Refunded
    orderTime: "2026-09-01T16:35:00Z",
    kitchenAcceptedAt: "2026-09-01T16:36:00Z",
    kitchenReadyAt: null,
    completedAt: null,
    items: [
      {
        id: "item-101-1",
        productId: "prod-1",
        name: "Classic Latte",
        variant: "Large (350ml)",
        variantPriceDelta: 40,
        unitPrice: 220,
        quantity: 2,
        addons: [{ id: "add-2", name: "Oat Milk Upgrade", price: 50 }],
        notes: "Extra hot with cinnamon dust on top",
        totalPrice: 540
      },
      {
        id: "item-101-2",
        productId: "prod-9",
        name: "Avocado Sourdough Toast",
        variant: "Standard",
        variantPriceDelta: 0,
        unitPrice: 320,
        quantity: 1,
        addons: [{ id: "add-6", name: "Extra Cheddar Cheese", price: 45 }],
        notes: "Well toasted sourdough",
        totalPrice: 365
      }
    ],
    subtotal: 905,
    discountAmount: 150,
    couponCode: "WELCOME50",
    couponId: "cpn-1",
    taxAmount: 37.75, // 5% on discounted subtotal (755 * 0.05)
    serviceCharge: 18.88,
    grandTotal: 811.63,
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    notes: "Customer is dining in at table T-01.",
    serverStaff: "David Chen"
  },
  {
    id: "ord-102",
    orderNumber: "DIN-8022",
    orderType: "dine-in",
    tableNumber: "T-06",
    tableId: "tbl-6",
    customerId: "cust-2",
    customerName: "Ananya Iyer",
    customerPhone: "+91 97412 33445",
    status: "Accepted",
    orderTime: "2026-09-01T16:48:00Z",
    kitchenAcceptedAt: "2026-09-01T16:49:00Z",
    kitchenReadyAt: null,
    completedAt: null,
    items: [
      {
        id: "item-102-1",
        productId: "prod-2",
        name: "Cappuccino Italiano",
        variant: "Regular",
        variantPriceDelta: 0,
        unitPrice: 190,
        quantity: 1,
        addons: [],
        notes: "No sugar",
        totalPrice: 190
      },
      {
        id: "item-102-2",
        productId: "prod-11",
        name: "Truffle Mushroom Artisan Pizza",
        variant: "Medium 10 inch",
        variantPriceDelta: 0,
        unitPrice: 460,
        quantity: 1,
        addons: [],
        notes: "Crispy crust",
        totalPrice: 460
      }
    ],
    subtotal: 650,
    discountAmount: 0,
    couponCode: null,
    couponId: null,
    taxAmount: 32.50,
    serviceCharge: 16.25,
    grandTotal: 698.75,
    paymentMethod: "Card",
    paymentStatus: "Pending",
    notes: "Garden Terrace seating.",
    serverStaff: "Elena Silva"
  },
  {
    id: "ord-100",
    orderNumber: "DIN-8020",
    orderType: "takeaway",
    tableNumber: null,
    tableId: null,
    customerId: "cust-3",
    customerName: "Vikram Malhotra",
    customerPhone: "+91 99160 55667",
    status: "Completed",
    orderTime: "2026-09-01T15:10:00Z",
    kitchenAcceptedAt: "2026-09-01T15:11:00Z",
    kitchenReadyAt: "2026-09-01T15:22:00Z",
    completedAt: "2026-09-01T15:25:00Z",
    items: [
      {
        id: "item-100-1",
        productId: "prod-5",
        name: "Nitro Cold Brew",
        variant: "Large (450ml)",
        variantPriceDelta: 50,
        unitPrice: 270,
        quantity: 1,
        addons: [{ id: "add-4", name: "Vanilla / Caramel Syrup", price: 35 }],
        notes: "Packed for commute",
        totalPrice: 305
      },
      {
        id: "item-100-2",
        productId: "prod-10",
        name: "Smoked Chicken Ciabatta",
        variant: "Standard Sandwich",
        variantPriceDelta: 0,
        unitPrice: 340,
        quantity: 1,
        addons: [],
        notes: "",
        totalPrice: 340
      }
    ],
    subtotal: 645,
    discountAmount: 50,
    couponCode: "COFFEE50",
    couponId: "cpn-3",
    taxAmount: 29.75,
    serviceCharge: 0,
    grandTotal: 624.75,
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    notes: "Takeaway order picked up.",
    serverStaff: "David Chen"
  }
];

export const initialAuditLogs = [
  { id: "log-1", timestamp: "2026-09-01T16:35:10Z", user: "David Chen (Cashier)", action: "CREATE_ORDER", category: "Orders", details: "Created Dine-in order #DIN-8021 for Rahul Sharma at Table T-01 ($811.63)", ip: "192.168.1.45" },
  { id: "log-2", timestamp: "2026-09-01T16:35:05Z", user: "David Chen (Cashier)", action: "APPLY_COUPON", category: "Coupons", details: "Validated and applied coupon WELCOME50 (₹150 discount) for order #DIN-8021", ip: "192.168.1.45" },
  { id: "log-3", timestamp: "2026-09-01T15:25:00Z", user: "David Chen (Cashier)", action: "COMPLETE_ORDER", category: "Orders", details: "Marked order #DIN-8020 as Completed and deducted stock for Nitro Cold Brew & Ciabatta", ip: "192.168.1.45" },
  { id: "log-4", timestamp: "2026-09-01T14:30:22Z", user: "Alex Walker (Admin)", action: "UPDATE_INVENTORY", category: "Inventory", details: "Adjusted Fresh Milk stock +10.0 L (Supplier shipment received)", ip: "192.168.1.10" },
  { id: "log-5", timestamp: "2026-09-01T11:00:15Z", user: "Alex Walker (Admin)", action: "USER_LOGIN", category: "Auth", details: "Admin logged into Cafe Management Portal", ip: "192.168.1.10" }
];

export const initialNotifications = [
  { id: "notif-1", title: "Low Stock Alert", message: "Fresh Full Cream Milk is at 3.2 L (Below minimum 10.0 L threshold).", type: "warning", time: "10 mins ago", isRead: false, link: "/inventory" },
  { id: "notif-2", title: "New Dine-in Order", message: "Order #DIN-8022 placed for Table T-06 (Ananya Iyer).", type: "order", time: "15 mins ago", isRead: false, link: "/kitchen" },
  { id: "notif-3", title: "Upcoming Reservation", message: "Priya Nair reserved Table T-03 for 4 guests at 6:00 PM today.", type: "reservation", time: "1 hour ago", isRead: true, link: "/reservations" },
  { id: "notif-4", title: "Purchase Order Received", message: "PO-2026-092 from Highland Dairy Farms marked as received.", type: "inventory", time: "3 hours ago", isRead: true, link: "/purchases" }
];
