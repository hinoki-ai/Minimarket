import { Doc, Id } from "convex/_generated/dataModel";

// Database document types
export type User = Doc<"users">;
export type Category = Doc<"categories">;
export type Product = Doc<"products">;
export type Cart = Doc<"carts">;
export type Order = Doc<"orders">;
export type InventoryLog = Doc<"inventoryLogs">;
export type Review = Doc<"reviews">;
export type PaymentAttempt = Doc<"paymentAttempts">;
export type Wishlist = Doc<"wishlists">;

// ID types for better type safety
export type UserId = Id<"users">;
export type CategoryId = Id<"categories">;
export type ProductId = Id<"products">;
export type CartId = Id<"carts">;
export type OrderId = Id<"orders">;
export type InventoryLogId = Id<"inventoryLogs">;
export type ReviewId = Id<"reviews">;
export type PaymentAttemptId = Id<"paymentAttempts">;
export type WishlistId = Id<"wishlists">;

// Nested types for better reusability
export type UserAddress = NonNullable<User["address"]>;
export type UserPreferences = NonNullable<User["preferences"]>;
export type ProductImage = Product["images"][number];
export type ProductInventory = Product["inventory"];
export type ProductDimensions = NonNullable<Product["dimensions"]>;
export type ProductFreshness = NonNullable<Product["freshness"]>;
export type ProductNutrition = NonNullable<Product["nutrition"]>;
export type CartItem = Cart["items"][number];
export type OrderItem = Order["items"][number];
export type CustomerInfo = Order["customerInfo"];
export type ShippingAddress = Order["shippingAddress"];
export type BillingAddress = NonNullable<Order["billingAddress"]>;

// Union types for status fields
export type OrderStatus = Order["status"];
export type PaymentStatus = Order["paymentStatus"];
export type InventoryLogType = InventoryLog["type"];

// Common API response types
export interface ProductWithCategory extends Product {
  category?: Category;
}

export interface CartWithProducts extends Omit<Cart, "items"> {
  items: Array<CartItem & {
    product?: Product;
  }>;
}

export interface OrderWithProducts extends Omit<Order, "items"> {
  items: Array<OrderItem & {
    product?: Product;
  }>;
}

export interface ProductWithReviews extends Product {
  reviews?: Review[];
  averageRating?: number;
  totalReviews?: number;
}

// Search and filter types
export interface ProductFilters {
  categoryId?: CategoryId;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
}

export interface ProductSortOptions {
  field: "name" | "price" | "createdAt" | "updatedAt";
  direction: "asc" | "desc";
}

// Cart operations
export interface AddToCartParams {
  productId: ProductId;
  quantity: number;
  userId?: string;
  sessionId?: string;
}

export interface UpdateCartItemParams {
  cartId: CartId;
  productId: ProductId;
  quantity: number;
}

// Order creation
export interface CreateOrderParams {
  userId?: string;
  customerInfo: CustomerInfo;
  shippingAddress: ShippingAddress;
  billingAddress?: BillingAddress;
  items: Array<{
    productId: ProductId;
    quantity: number;
  }>;
  shippingMethod?: string;
  paymentMethod?: string;
}

// Review creation
export interface CreateReviewParams {
  productId: ProductId;
  userId?: string;
  orderId?: OrderId;
  customerName: string;
  rating: number;
  title?: string;
  content?: string;
  isVerifiedPurchase: boolean;
}

// Pagination types
export interface PaginationResult<T> {
  page: T[];
  isDone: boolean;
  continueCursor: string;
}

// Error types
export interface ConvexError {
  message: string;
  code?: string;
  data?: any;
}

// Component prop types
export interface ProductCardProps {
  product: Product;
  category?: Category;
  showAddToCart?: boolean;
  showWishlist?: boolean;
  className?: string;
}

export interface CategoryCardProps {
  category: Category;
  productsCount?: number;
  className?: string;
}

export interface CartItemProps {
  item: CartItem;
  product?: Product;
  onUpdateQuantity?: (productId: ProductId, quantity: number) => void;
  onRemove?: (productId: ProductId) => void;
}