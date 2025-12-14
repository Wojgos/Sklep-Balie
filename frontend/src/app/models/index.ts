export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

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

export interface Category {
  id: string;
  name: string;
  description: string | null;
  image: string;
  productCount: number;
  slug?: string;
  parent?: string | null;
  childCategories?: Category[];
  totalProductCount?: number;
}

export interface InsertCategory {
  name: string;
  description?: string;
  image: string;
  productCount?: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  priceModifier?: number; // Dodatkowa opłata lub zniżka
}

export interface ProductAttribute {
  id: string;
  name: string; 
  type: 'color' | 'size' | 'text';
  variants: ProductVariant[];
}

export interface Product {
  id: string;
  numericId?: number;
  slug?: string;
  name: string;
  description: string | null;
  price: string;
  oldPrice: string | null;
  rating: number;
  categoryId: string;
  category?: string; 
  category_id?: number; 
  category_name?: string; 
  image: string;
  images?: any[]; 
  stock: number;
  createdAt: Date;
  created_at?: string; 
  updatedAt?: Date;
  updated_at?: string;
  available?: boolean; 
  attributes?: ProductAttribute[]; 
  variantSummary?: string;
  variantCount?: number;
  variantId?: number;
  minPrice?: string;
  maxPrice?: string;
  available_attributes?: { [key: string]: string[] };
  variants?: ProductSkuVariant[];
}

export interface ProductSkuVariant {
  id: number;
  product: number;
  sku: string;
  name: string;
  price: string;
  stock: number;
  low_stock_threshold: number;
  available: boolean;
  attributes_details: { attribute: string; value: string }[];
  images: any[];
}

export interface InsertProduct {
  name: string;
  description?: string;
  price: string;
  oldPrice?: string;
  rating?: number;
  categoryId: string;
  image: string;
  stock?: number;
}

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
  paid?: boolean;
  trackingNumber?: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt?: Date;
  items?: OrderItem[]; 
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
  couponCode?: string;
  discountAmount?: number;
}

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
  productNumericId?: number;
  variantId?: number;
  productName: string;
  quantity: number;
  price: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

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
  duration?: number; 
  createdAt: Date;
}

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

export interface MonthlyData {
  month: string; 
  month_name: string; 
  revenue: number;
  orders_count: number;
  avg_order_value: number;
  growth_rate: number | null; 
  growth_amount: number | null; 
}

export interface MonthlyStatistics {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_revenue: number;
    total_orders: number;
    avg_monthly_revenue: number;
    months_count: number;
  };
  best_month: MonthlyData | null;
  worst_month: MonthlyData | null;
  monthly_data: MonthlyData[];
}

export interface QuarterlyData {
  quarter: string;
  quarter_name: string; 
  year: number;
  revenue: number;
  orders_count: number;
  avg_order_value: number;
  growth_rate: number | null;
}

export interface QuarterlyStatistics {
  year: number;
  quarterly_data: QuarterlyData[];
}

export interface YearlyData {
  year: number;
  revenue: number;
  orders_count: number;
  avg_order_value: number;
  growth_rate: number | null;
  growth_amount: number | null;
}

export interface YearlyStatistics {
  yearly_data: YearlyData[];
}

export interface PeriodComparison {
  period1: {
    start_date: string;
    end_date: string;
    stats: {
      revenue: number;
      orders_count: number;
      avg_order_value: number;
    };
  };
  period2: {
    start_date: string;
    end_date: string;
    stats: {
      revenue: number;
      orders_count: number;
      avg_order_value: number;
    };
  };
  comparison: {
    revenue_difference: number;
    revenue_growth_rate: number;
    orders_difference: number;
    orders_growth_rate: number;
  };
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  product_slug: string;
  quantity_sold: number;
  revenue: number;
  orders_count: number;
  avg_price: number;
}

export interface TopProductsReport {
  period: {
    start_date: string;
    end_date: string;
  };
  top_products: TopProduct[];
}

export interface CategoryPerformance {
  category_id: string;
  category_name: string;
  quantity_sold: number;
  revenue: number;
  orders_count: number;
  revenue_percentage: number;
}

export interface CategoryPerformanceReport {
  period: {
    start_date: string;
    end_date: string;
  };
  total_revenue: number;
  categories: CategoryPerformance[];
}

export interface DashboardOverview {
  today: {
    revenue: number;
    orders_count: number;
  };
  current_month: {
    revenue: number;
    orders_count: number;
    growth_rate: number;
  };
  current_year: {
    revenue: number;
    orders_count: number;
  };
  previous_month: {
    revenue: number;
    orders_count: number;
  };
}

export interface LowStockAlert {
  product: Product;
  currentStock: number;
  threshold: number;
  suggestedOrder: number;
}

export interface LowStockVariantAlert {
  variant: ProductSkuVariant;
  productName: string;
  productSlug: string;
  categoryName: string;
  currentStock: number;
  threshold: number;
  difference: number;
  suggestedOrder: number;
  severity: 'critical' | 'warning' | 'info';
}

export interface LowStockStatistics {
  total_variants: number;
  low_stock_count: number;
  critical_count: number;
  warning_count: number;
  ok_count: number;
}

export interface GroupedLowStockAlert {
  productId: number;
  productName: string;
  productSlug: string;
  categoryName: string;
  variants: LowStockVariantAlert[];
  totalVariantsAffected: number;
  hasCritical: boolean;
}

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
  message_count?: number;  
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

export interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  pointsPerZloty: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number; 
  pointsRequired: number; 
  points_required?: number; 
  rewardType: 'discount_percentage' | 'discount_fixed' | 'free_product' | 'free_shipping';
  rewardValue: number; 
  reward_value?: string; 
  isActive: boolean; 
  is_percentage?: boolean; 
  isPercentage: boolean;
  active?: boolean; 
  image?: string;
  validUntil?: Date;
  usageLimit?: number; 
  createdAt?: Date;
  created_at?: string; 
}

export interface UserLoyaltyPoints {
  userId: string;
  totalPoints: number;
  availablePoints: number;
  usedPoints: number;
  currentTier?: string;
  tierProgress?: number; 
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
  rewardName?: string; 
  reward?: LoyaltyReward;
  pointsSpent: number;
  code?: string; 
  couponCode?: string; 
  isUsed: boolean;
  usedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  redeemedAt?: string;
  couponDetails?: {
    code: string;
    validFrom: string;
    validTo: string;
    value: number;
    isPercentage: boolean;
    active: boolean;
  };
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

