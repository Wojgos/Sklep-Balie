// User models
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  role?: 'admin' | 'user';
  createdAt?: Date;
}

export interface InsertUser {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

// Category models
export interface Category {
  id: string;
  name: string;
  description: string | null;
  image: string;
  productCount: number;
}

export interface InsertCategory {
  name: string;
  description?: string;
  image: string;
  productCount?: number;
}

// Product Variant models
export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  priceModifier?: number; // Dodatkowa opłata lub zniżka
  stockModifier?: number; // Modyfikator stanu magazynowego
}

export interface ProductAttribute {
  id: string;
  name: string; // np. "Kolor", "Rozmiar"
  type: 'color' | 'size' | 'text';
  variants: ProductVariant[];
}

// Product models
export interface Product {
  id: string;
  name: string;
  description: string | null;
  dimensions: string;
  price: string;
  oldPrice: string | null;
  rating: number;
  categoryId: string;
  image: string;
  stock: number;
  material: string | null;
  createdAt: Date;
  attributes?: ProductAttribute[]; // Opcjonalne atrybuty z wariantami
}

export interface InsertProduct {
  name: string;
  description?: string;
  dimensions: string;
  price: string;
  oldPrice?: string;
  rating?: number;
  categoryId: string;
  image: string;
  stock?: number;
  material?: string;
}

// Order models
export interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  totalPrice: string;
  status: string;
  notes: string | null;
  createdAt: Date;
}

export interface InsertOrder {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  totalPrice: string;
  notes?: string;
}

// Order Item models
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: string;
}

export interface InsertOrderItem {
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: string;
}

// Cart models
export interface CartItem {
  product: Product;
  quantity: number;
}

// Notification models
export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number; // Auto-dismiss duration in milliseconds (null for manual dismiss only)
  createdAt: Date;
}

// Chatbot models
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: ChatAction[];
  isUser?: boolean;
  isTyping?: boolean;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  context?: {
    currentPage?: string;
    userIntent?: string;
    products?: Product[];
    categories?: Category[];
    sessionId?: string;
  };
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
  actions?: ChatAction[];
}

export interface ChatAction {
  type: 'product' | 'category' | 'link' | 'search' | 'navigate' | 'filter' | 'contact';
  label: string;
  value?: string;
  data?: any;
}

// Sales Statistics models
export interface SalesStatistics {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  averageOrderValue: number;
  topProducts: {
    product: Product;
    quantity: number;
    revenue: number;
  }[];
  revenueByCategory: {
    category: Category;
    revenue: number;
  }[];
  ordersByStatus: {
    status: string;
    count: number;
  }[];
}

// Low Stock Alert models
export interface LowStockAlert {
  product: Product;
  currentStock: number;
  threshold: number;
  suggestedOrder: number;
}

// Support Ticket models
export interface TicketMessage {
  id: string;
  author_id: number;
  body: string;
  created_at: Date;
}

export interface Ticket {
  id: string;
  user: User;
  subject: string;
  status: 'new' | 'in_progress' | 'closed';
  created_at: Date;
  updated_at: Date;
  messages?: TicketMessage[];
  participants?: User[];
}

export interface InsertTicket {
  subject: string;
  body: string;
}

export interface TicketReply {
  body: string;
}

export interface TicketStatusUpdate {
  status: 'new' | 'in_progress' | 'closed';
}

// Loyalty Program models
export interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  pointsPerZloty: number; // Ile punktów za 1 PLN
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  rewardType: 'discount_percentage' | 'discount_fixed' | 'free_product' | 'free_shipping';
  rewardValue: number; // Wartość zniżki lub ID produktu
  isActive: boolean;
  image?: string;
  validUntil?: Date;
  usageLimit?: number; // Limit użyć na użytkownika (null = bez limitu)
  createdAt: Date;
}

export interface UserLoyaltyPoints {
  userId: string;
  totalPoints: number;
  availablePoints: number;
  usedPoints: number;
  currentTier?: string;
  tierProgress?: number; // Procent do następnego poziomu
  history: LoyaltyTransaction[];
}

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'spent' | 'expired';
  points: number;
  description: string;
  orderId?: string;
  rewardId?: string;
  createdAt: Date;
}

export interface RedeemedReward {
  id: string;
  userId: string;
  rewardId: string;
  reward: LoyaltyReward;
  pointsSpent: number;
  code?: string; // Kod kuponu jeśli applicable
  isUsed: boolean;
  usedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface InsertLoyaltyProgram {
  name: string;
  description: string;
  pointsPerZloty: number;
  isActive: boolean;
}

export interface InsertLoyaltyReward {
  name: string;
  description: string;
  pointsCost: number;
  rewardType: 'discount_percentage' | 'discount_fixed' | 'free_product' | 'free_shipping';
  rewardValue: number;
  isActive: boolean;
  image?: string;
  validUntil?: Date;
  usageLimit?: number;
}

