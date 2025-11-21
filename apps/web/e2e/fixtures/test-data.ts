/**
 * Test Data Fixtures - TopSteel ERP
 * Mock data for E2E tests
 */

/**
 * Test Users
 */
export const TEST_USERS = {
  admin: {
    email: 'admin@topsteel.fr',
    password: 'admin123',
    acronym: 'ADMIN',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
  },
  regularUser: {
    email: 'user@topsteel.fr',
    password: 'user123',
    acronym: 'USER',
    role: 'user',
    firstName: 'Regular',
    lastName: 'User',
  },
  manager: {
    email: 'manager@topsteel.fr',
    password: 'manager123',
    acronym: 'MGR',
    role: 'manager',
    firstName: 'Manager',
    lastName: 'User',
  },
  guest: {
    email: 'guest@topsteel.fr',
    password: 'guest123',
    acronym: 'GUEST',
    role: 'guest',
    firstName: 'Guest',
    lastName: 'User',
  },
} as const

/**
 * Invalid credentials for testing
 */
export const INVALID_CREDENTIALS = {
  wrongPassword: {
    email: 'admin@topsteel.fr',
    password: 'wrongpassword',
  },
  nonExistentUser: {
    email: 'nonexistent@topsteel.fr',
    password: 'password123',
  },
  emptyFields: {
    email: '',
    password: '',
  },
  sqlInjection: {
    email: "admin' OR '1'='1",
    password: "admin' OR '1'='1",
  },
} as const

/**
 * Test Companies
 */
export const TEST_COMPANIES = {
  mainCompany: {
    id: '1',
    name: 'TopSteel SAS',
    acronym: 'TS',
    siret: '12345678901234',
    address: '123 Rue de la Métallurgie',
    city: 'Paris',
    postalCode: '75001',
    country: 'France',
  },
  subsidiaryCompany: {
    id: '2',
    name: 'TopSteel Logistics',
    acronym: 'TSL',
    siret: '98765432109876',
    address: '456 Avenue du Commerce',
    city: 'Lyon',
    postalCode: '69001',
    country: 'France',
  },
} as const

/**
 * Test Articles/Materials
 */
export const TEST_ARTICLES = {
  steelBeam: {
    code: 'STL-BEAM-001',
    name: 'Poutrelle en acier HEB 200',
    category: 'Poutrelles',
    unit: 'ML',
    unitPrice: 45.5,
    stockQuantity: 150,
    minStock: 20,
    description: 'Poutrelle en acier haute résistance',
  },
  steelSheet: {
    code: 'STL-SHEET-001',
    name: 'Tôle acier 3mm',
    category: 'Tôles',
    unit: 'M2',
    unitPrice: 25.0,
    stockQuantity: 300,
    minStock: 50,
    description: 'Tôle en acier galvanisé 3mm épaisseur',
  },
  steelBar: {
    code: 'STL-BAR-001',
    name: 'Barre ronde Ø20mm',
    category: 'Barres',
    unit: 'ML',
    unitPrice: 8.75,
    stockQuantity: 500,
    minStock: 100,
    description: 'Barre ronde en acier Ø20mm',
  },
} as const

/**
 * Test Partners (Clients/Suppliers)
 */
export const TEST_PARTNERS = {
  client1: {
    type: 'client',
    name: 'Construction SA',
    siret: '11111111111111',
    email: 'contact@construction-sa.fr',
    phone: '+33 1 23 45 67 89',
    address: '10 Boulevard Haussmann',
    city: 'Paris',
    postalCode: '75009',
    country: 'France',
    contactPerson: 'Jean Dupont',
  },
  supplier1: {
    type: 'supplier',
    name: 'Acier & Métaux SAS',
    siret: '22222222222222',
    email: 'commandes@acier-metaux.fr',
    phone: '+33 4 56 78 90 12',
    address: '25 Rue de l\'Industrie',
    city: 'Marseille',
    postalCode: '13001',
    country: 'France',
    contactPerson: 'Marie Martin',
  },
  client2: {
    type: 'client',
    name: 'Bâtiment Moderne',
    siret: '33333333333333',
    email: 'info@batiment-moderne.fr',
    phone: '+33 2 34 56 78 90',
    address: '50 Avenue des Champs',
    city: 'Nantes',
    postalCode: '44000',
    country: 'France',
    contactPerson: 'Pierre Dubois',
  },
} as const

/**
 * Test Projects
 */
export const TEST_PROJECTS = {
  project1: {
    code: 'PRJ-2024-001',
    name: 'Construction Immeuble Tour Eiffel',
    client: 'Construction SA',
    status: 'in_progress',
    startDate: '2024-01-15',
    endDate: '2024-12-31',
    budget: 150000,
    description: 'Construction d\'un immeuble de 10 étages',
  },
  project2: {
    code: 'PRJ-2024-002',
    name: 'Rénovation Pont Lyon',
    client: 'Bâtiment Moderne',
    status: 'pending',
    startDate: '2024-03-01',
    endDate: '2024-09-30',
    budget: 85000,
    description: 'Rénovation complète du pont',
  },
} as const

/**
 * Test Orders
 */
export const TEST_ORDERS = {
  order1: {
    orderNumber: 'CMD-2024-0001',
    client: 'Construction SA',
    orderDate: '2024-01-10',
    deliveryDate: '2024-01-20',
    status: 'confirmed',
    totalAmount: 12500,
    items: [
      {
        article: 'STL-BEAM-001',
        quantity: 50,
        unitPrice: 45.5,
      },
      {
        article: 'STL-SHEET-001',
        quantity: 100,
        unitPrice: 25.0,
      },
    ],
  },
  order2: {
    orderNumber: 'CMD-2024-0002',
    client: 'Bâtiment Moderne',
    orderDate: '2024-01-15',
    deliveryDate: '2024-02-01',
    status: 'pending',
    totalAmount: 8750,
    items: [
      {
        article: 'STL-BAR-001',
        quantity: 200,
        unitPrice: 8.75,
      },
    ],
  },
} as const

/**
 * Test Settings
 */
export const TEST_SETTINGS = {
  appearance: {
    theme: 'light',
    language: 'fr',
    accentColor: 'blue',
    fontSize: 'medium',
    density: 'comfortable',
    contentWidth: 'compact',
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
    orderNotifications: true,
    stockAlerts: true,
    systemUpdates: false,
  },
} as const

/**
 * Test Menu Items
 */
export const TEST_MENU_ITEMS = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    path: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    id: 'inventory',
    label: 'Inventaire',
    path: '/inventory',
    icon: 'Package',
    children: [
      { id: 'articles', label: 'Articles', path: '/inventory/articles' },
      { id: 'stock', label: 'Stock', path: '/inventory/stock' },
      { id: 'materials', label: 'Matériaux', path: '/inventory/materials' },
    ],
  },
  {
    id: 'partners',
    label: 'Partenaires',
    path: '/partners',
    icon: 'Users',
    children: [
      { id: 'clients', label: 'Clients', path: '/partners/clients' },
      { id: 'suppliers', label: 'Fournisseurs', path: '/partners/suppliers' },
    ],
  },
  {
    id: 'sales',
    label: 'Ventes',
    path: '/sales',
    icon: 'ShoppingCart',
    children: [
      { id: 'orders', label: 'Commandes', path: '/sales/orders' },
      { id: 'quotes', label: 'Devis', path: '/sales/quotes' },
    ],
  },
  {
    id: 'settings',
    label: 'Paramètres',
    path: '/settings',
    icon: 'Settings',
    children: [
      { id: 'appearance', label: 'Apparence', path: '/settings/appearance' },
      { id: 'notifications', label: 'Notifications', path: '/settings/notifications' },
      { id: 'security', label: 'Sécurité', path: '/settings/security' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    path: '/admin',
    icon: 'Shield',
    requiredRole: 'admin',
    children: [
      { id: 'users', label: 'Utilisateurs', path: '/admin/users' },
      { id: 'roles', label: 'Rôles', path: '/admin/roles' },
      { id: 'menus', label: 'Menus', path: '/admin/menus' },
    ],
  },
] as const

/**
 * Error messages for testing
 */
export const ERROR_MESSAGES = {
  invalidCredentials: 'Identifiants invalides',
  emailRequired: 'L\'email est requis',
  passwordRequired: 'Le mot de passe est requis',
  networkError: 'Erreur réseau',
  serverError: 'Erreur serveur',
  unauthorized: 'Non autorisé',
  notFound: 'Page non trouvée',
  validationError: 'Erreur de validation',
} as const

/**
 * Success messages for testing
 */
export const SUCCESS_MESSAGES = {
  loginSuccess: 'Connexion réussie',
  logoutSuccess: 'Déconnexion réussie',
  saveSuccess: 'Enregistrement réussi',
  updateSuccess: 'Mise à jour réussie',
  deleteSuccess: 'Suppression réussie',
  createSuccess: 'Création réussie',
} as const
