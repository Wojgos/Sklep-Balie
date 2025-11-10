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

