export type OrderType = 'delivery' | 'takeaway' | 'dine_in';

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'cod' | 'upi' | 'counter';
export type PaymentStatus = 'pending' | 'completed' | 'verification_required';

export interface CustomizationOption {
  name: string;
  price: number;
}

export interface ProductCustomizationGroup {
  name: string;
  type: 'single' | 'multiple';
  options: CustomizationOption[];
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  isAvailable: boolean;
  isBestseller?: boolean;
  isEggless?: boolean;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  prepTimeMinutes?: number;
  customizationGroups?: ProductCustomizationGroup[];
}

export interface CartItemOption {
  groupName: string;
  optionName: string;
  price: number;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  product: Product;
  quantity: number;
  selectedOptions: CartItemOption[];
  specialInstructions?: string;
  unitPrice: number;
  totalPrice: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  freeAbove: number;
  estimatedMinutes: string;
  description: string;
}

export interface Coupon {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxDiscount?: number;
  minOrder: number;
  isActive: boolean;
  badge?: string;
  expiryDate?: string;
}

export interface CustomerProfile {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  deliveryInstructions?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  trackingToken: string;
  userId?: string;
  customerEmail?: string;
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  deliveryAddress?: string;
  landmark?: string;
  zoneId?: string;
  tableNumber?: string;
  timeSlot: string; // 'asap' | specific slot like '4:00 PM - 4:30 PM'
  scheduledDate: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode?: string;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  upiTxnId?: string;
  status: OrderStatus;
  orderNotes?: string;
  isNoContactDelivery?: boolean;
  createdAt: string;
  estimatedDeliveryTime?: string;
  delayMinutes?: number;
  delayMessage?: string;
}

export interface CustomCakeEnquiry {
  id: string;
  enquiryNumber: string;
  customerName: string;
  customerPhone: string;
  customerWhatsApp: string;
  occasion: string;
  eventDate: string;
  preferredTime: string;
  servings: string;
  weightKg: number;
  flavour: string;
  shape: string;
  themeDescription: string;
  colorPreference: string;
  messageOnCake: string;
  isEggless: boolean;
  referenceImage?: string; // base64 or URL
  approximateBudget?: number;
  additionalNotes?: string;
  status: 'enquiry_received' | 'under_review' | 'quotation_sent' | 'approved' | 'rejected' | 'completed';
  quotationAmount?: number;
  adminNotes?: string;
  createdAt: string;
}

export interface CustomerIssue {
  id: string;
  orderNumber: string;
  customerPhone: string;
  customerName: string;
  issueType: 'late_delivery' | 'missing_item' | 'wrong_item' | 'cake_issue' | 'food_quality' | 'payment_issue' | 'other';
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  resolutionNotes?: string;
}

export interface CustomerFeedback {
  id: string;
  orderNumber: string;
  rating: number;
  category: 'Food' | 'Delivery' | 'Service' | 'Packaging' | 'Cake';
  likes: string[];
  improvements: string[];
  comments: string;
  createdAt: string;
  resolved?: boolean;
}

export interface BusinessSettings {
  name: string;
  address: string;
  landmark: string;
  phone: string;
  whatsapp: string;
  isOpenManual: boolean;
  openingTime: string; // "10:00"
  closingTime: string; // "22:00"
  weeklyOff: string; // "None"
  upiId: string;
  upiMerchantName: string;
  announcementText?: string;
  showAnnouncement: boolean;
  maxOrdersPerSlot: number;
  defaultPrepMinutes: number;
}

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  category: 'Food' | 'Cakes' | 'Pizza' | 'Service' | 'Atmosphere' | 'Delivery';
  verifiedCustomer?: boolean;
  ownerReply?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'manager';
  isActive: boolean;
  createdAt: string;
}
