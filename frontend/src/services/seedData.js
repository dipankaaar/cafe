export const initialCafeSettings = {
  cafeName: "Petuk Adda Cafe",
  tagline: "Where every sip and bite tells a story.",
  logo: "https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/02/dineos-logo-white.svg",
  address: "Salboni, Sakadihi-Ailakundi Road, Near Salboni High School, Salboni, West Bengal 722102",
  phone: "+91 9932148058",
  altPhone: "+91 6292314286",
  email: "petukaddacafe@gmail.com",
  website: "https://petukaddacafe.com",
  currency: "₹",
  currencyCode: "INR",
  taxRate: 5.0, // 5% GST
  taxNumber: "GSTIN-19AABCU9603R1ZM",
  serviceChargeRate: 0.0,
  loyaltyPointsPerHundred: 1, // 1 point per 100 spent
  loyaltyPointRedemptionValue: 1, // 1 point = 1 currency unit
  minPointsToRedeem: 50,
  invoicePrefix: "DN-",
  invoiceFooterMessage: "Thank you for visiting Petuk Adda Cafe! Where every sip and bite tells a story.",
  openingHours: "Morning: 09:00 AM – 01:30 PM | Evening: 04:30 PM – 10:30 PM (Open All Days)",
  deliveryArea: "Bankura Town",
  lowStockThresholdDefault: 5,
  heroBadge: "Artisan Coffee & Gourmet Dining • Salboni",
  heroTitlePrefix: "Welcome To",
  heroTitleHighlight: "Petuk Adda Cafe",
  heroSubtitle: "Where every sip and bite tells a story. Premium espresso, artisan coffee and gourmet dining — order from your table or explore the menu.",
  heroImage: "https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/restaurant.webp"
};

export const initialCategories = [
  { id: "cat-beverage", name: "Beverage", slug: "beverage", icon: "CupSoda", color: "#3B82F6", itemCount: 0, isActive: true },
  { id: "cat-breakfast", name: "Break Fast", slug: "break-fast", icon: "Croissant", color: "#F59E0B", itemCount: 0, isActive: true },
  { id: "cat-moglai", name: "Moglai", slug: "moglai", icon: "Sparkles", color: "#D97706", itemCount: 0, isActive: true },
  { id: "cat-chowmin-rolls-pasta", name: "Chowmin, Rolls & Pasta", slug: "chowmin-rolls-pasta", icon: "Utensils", color: "#EF4444", itemCount: 0, isActive: true },
  { id: "cat-soup", name: "Soup", slug: "soup", icon: "Soup", color: "#EA580C", itemCount: 0, isActive: true },
  { id: "cat-noodles", name: "Noodles", slug: "noodles", icon: "UtensilsCrossed", color: "#E11D48", itemCount: 0, isActive: true },
  { id: "cat-starter-veg", name: "Starter (Veg)", slug: "starter-veg", icon: "Leaf", color: "#10B981", itemCount: 0, isActive: true },
  { id: "cat-starter-nonveg", name: "Starter (Non Veg)", slug: "starter-nonveg", icon: "Flame", color: "#DC2626", itemCount: 0, isActive: true },
  { id: "cat-chinese-gravy", name: "Chinese Gravy", slug: "chinese-gravy", icon: "BowlFood", color: "#B45309", itemCount: 0, isActive: true },
  { id: "cat-indian-gravy", name: "Indian Gravy", slug: "indian-gravy", icon: "CookingPot", color: "#DD5903", itemCount: 0, isActive: true },
  { id: "cat-roti", name: "Roti", slug: "roti", icon: "CircleDot", color: "#78350F", itemCount: 0, isActive: true },
  { id: "cat-rice", name: "Rice", slug: "rice", icon: "Utensils", color: "#059669", itemCount: 0, isActive: true },
  { id: "cat-mocktail", name: "Mocktail", slug: "mocktail", icon: "GlassWater", color: "#0284C7", itemCount: 0, isActive: true },
  { id: "cat-shake", name: "Shake", slug: "shake", icon: "Milk", color: "#DB2777", itemCount: 0, isActive: true },
  { id: "cat-ice-cream", name: "Ice Cream", slug: "ice-cream", icon: "IceCream", color: "#9333EA", itemCount: 0, isActive: true },
  { id: "cat-lassi", name: "Lassi", slug: "lassi", icon: "GlassWater", color: "#16A34A", itemCount: 0, isActive: true }
];

export const initialAddons = [
  { id: "add-1", name: "Extra Cheese / Butter", price: 20, category: "Topping", isAvailable: true },
  { id: "add-2", name: "Extra Egg", price: 15, category: "Food", isAvailable: true },
  { id: "add-3", name: "Extra Chicken Pieces", price: 40, category: "Food", isAvailable: true },
  { id: "add-4", name: "Green Salad & Sauce Dip", price: 20, category: "Side", isAvailable: true }
];

export const initialProducts = [];

export const initialTables = [
  { id: "tbl-1", tableNumber: "T-01", zone: "Indoor Cafe", capacity: 2, status: "Occupied", currentOrderId: "ord-101", customerName: "Arjun Das", x: 1, y: 1 },
  { id: "tbl-2", tableNumber: "T-02", zone: "Indoor Cafe", capacity: 4, status: "Available", currentOrderId: null, customerName: null, x: 2, y: 1 },
  { id: "tbl-3", tableNumber: "T-03", zone: "Indoor Cafe", capacity: 4, status: "Reserved", currentOrderId: null, customerName: "Sita Patel", x: 3, y: 1 },
  { id: "tbl-4", tableNumber: "T-04", zone: "Indoor Cafe", capacity: 6, status: "Available", currentOrderId: null, customerName: null, x: 4, y: 1 },
  { id: "tbl-5", tableNumber: "T-05", zone: "Garden Terrace", capacity: 2, status: "Available", currentOrderId: null, customerName: null, x: 1, y: 2 },
  { id: "tbl-6", tableNumber: "T-06", zone: "Garden Terrace", capacity: 4, status: "Occupied", currentOrderId: "ord-102", customerName: "Meera Sen", x: 2, y: 2 },
  { id: "tbl-7", tableNumber: "T-07", zone: "Garden Terrace", capacity: 4, status: "Cleaning", currentOrderId: null, customerName: null, x: 3, y: 2 },
  { id: "tbl-8", tableNumber: "T-08", zone: "Garden Terrace", capacity: 8, status: "Available", currentOrderId: null, customerName: null, x: 4, y: 2 }
];

export const initialCustomers = [
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
    code: "PETUK20",
    name: "Petuk Adda 20% Welcome",
    description: "20% flat discount on all handcrafted specialty coffees & gourmet dining.",
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
  { id: "res-1", customerName: "Sita Patel", phone: "+91 98888 77665", email: "sita.patel@example.com", date: "2026-09-01", time: "18:00", guests: 4, tableId: "tbl-3", tableNumber: "T-03", status: "Confirmed", specialRequest: "Window side birthday setup with extra napkins.", createdAt: "2026-09-01T10:12:00Z" },
  { id: "res-2", customerName: "Marcus Thorne", phone: "+61 422 998 877", email: "marcus@thorne.com", date: "2026-09-01", time: "19:30", guests: 6, tableId: "tbl-4", tableNumber: "T-04", status: "Pending", specialRequest: "Quiet booth for business discussion.", createdAt: "2026-09-01T12:45:00Z" },
  { id: "res-3", customerName: "Clara Oswald", phone: "+61 433 112 244", email: "clara@oswald.com", date: "2026-09-02", time: "11:00", guests: 2, tableId: "tbl-5", tableNumber: "T-05", status: "Confirmed", specialRequest: "Outdoor terrace table.", createdAt: "2026-09-01T14:20:00Z" }
];

export const initialOrders = [
  {
    id: "ord-101",
    orderNumber: "DN-8021",
    orderType: "dine-in",
    tableNumber: "T-01",
    tableId: "tbl-1",
    customerId: "cust-101",
    customerName: "Arjun Das",
    customerPhone: "+91 98000 11223",
    status: "brewing", // placed, accepted, brewing, ready, completed, cancelled, refunded
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
    orderNumber: "DN-8022",
    orderType: "dine-in",
    tableNumber: "T-06",
    tableId: "tbl-6",
    customerId: "cust-102",
    customerName: "Meera Sen",
    customerPhone: "+91 98000 33445",
    status: "accepted",
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
    orderNumber: "DN-8020",
    orderType: "takeaway",
    tableNumber: null,
    tableId: null,
    customerId: "cust-100",
    customerName: "Rohan Roy",
    customerPhone: "+91 98000 55667",
    status: "completed",
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
  { id: "log-1", timestamp: "2026-09-01T16:35:10Z", user: "David Chen (Cashier)", action: "CREATE_ORDER", category: "Orders", details: "Created Dine-in order #DN-8021 for Arjun Das at Table T-01 ($811.63)", ip: "192.168.1.45" },
  { id: "log-2", timestamp: "2026-09-01T16:35:05Z", user: "David Chen (Cashier)", action: "APPLY_COUPON", category: "Coupons", details: "Validated and applied coupon WELCOME50 (₹150 discount) for order #DN-8021", ip: "192.168.1.45" },
  { id: "log-3", timestamp: "2026-09-01T15:25:00Z", user: "David Chen (Cashier)", action: "COMPLETE_ORDER", category: "Orders", details: "Marked order #DN-8020 as Completed and deducted stock for Nitro Cold Brew & Ciabatta", ip: "192.168.1.45" },
  { id: "log-4", timestamp: "2026-09-01T14:30:22Z", user: "Alex Walker (Admin)", action: "UPDATE_INVENTORY", category: "Inventory", details: "Adjusted Fresh Milk stock +10.0 L (Supplier shipment received)", ip: "192.168.1.10" },
  { id: "log-5", timestamp: "2026-09-01T11:00:15Z", user: "Alex Walker (Admin)", action: "USER_LOGIN", category: "Auth", details: "Admin logged into Cafe Management Portal", ip: "192.168.1.10" }
];

export const initialNotifications = [
  { id: "notif-1", title: "Low Stock Alert", message: "Fresh Full Cream Milk is at 3.2 L (Below minimum 10.0 L threshold).", type: "warning", time: "10 mins ago", isRead: false, link: "/inventory" },
  { id: "notif-2", title: "New Dine-in Order", message: "Order #DN-8022 placed for Table T-06 (Meera Sen).", type: "order", time: "15 mins ago", isRead: false, link: "/kitchen" },
  { id: "notif-3", title: "Upcoming Reservation", message: "Sita Patel reserved Table T-03 for 4 guests at 6:00 PM today.", type: "reservation", time: "1 hour ago", isRead: true, link: "/reservations" },
  { id: "notif-4", title: "Purchase Order Received", message: "PO-2026-092 from Highland Dairy Farms marked as received.", type: "inventory", time: "3 hours ago", isRead: true, link: "/purchases" }
];
