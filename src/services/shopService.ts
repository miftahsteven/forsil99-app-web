import { apiClient } from './apiClient';
import { Product, Shop } from '@/types';

export async function fetchProducts(
  categoryId?: string,
  search?: string,
  ownerId?: string
): Promise<Product[]> {
  try {
    const params = new URLSearchParams();
    if (categoryId && categoryId !== 'all') params.append('categoryId', categoryId);
    if (search) params.append('search', search);
    if (ownerId) params.append('ownerId', ownerId);

    const qs = params.toString();
    const url = qs ? `/products?${qs}` : '/products';
    const res = await apiClient.get(url);
    return res.products || [];
  } catch (err) {
    console.warn('Fetch products error:', err);
    return [];
  }
}

export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const res = await apiClient.get(`/products/${id}`);
    return res.product || null;
  } catch {
    return null;
  }
}

export async function createProduct(payload: {
  name: string;
  type?: 'product' | 'service';
  categoryId: string;
  categoryName: string;
  description: string;
  imageUrls: string[];
  priceType?: 'fixed' | 'starting_from' | 'contact_seller';
  price?: number;
  unit?: string;
  city?: string;
  serviceAreas?: string[];
}): Promise<Product> {
  const res = await apiClient.post('/products', payload);
  return res.product;
}

export async function fetchShops(ownerId?: string): Promise<Shop[]> {
  try {
    const url = ownerId ? `/shops?ownerId=${encodeURIComponent(ownerId)}` : '/shops';
    const res = await apiClient.get(url);
    return res.shops || [];
  } catch {
    return [];
  }
}

export async function fetchMyShop(): Promise<Shop | null> {
  try {
    const res = await apiClient.get('/shops/my-shop');
    return res.shop || null;
  } catch {
    return null;
  }
}

export async function registerSellerShop(payload: {
  name: string;
  categoryIds: string[];
  address: string;
  isDonator: boolean;
  donationNote?: string;
  termsAccepted: boolean;
  description?: string;
  city?: string;
  contactPhone?: string;
  businessType?: 'product' | 'service' | 'both';
}): Promise<{ success: boolean; shop: Shop; message: string }> {
  const res = await apiClient.post('/shops', payload);
  return res;
}

export async function fetchAdminShopQueue(): Promise<any[]> {
  try {
    const res = await apiClient.get('/shops/admin/queue');
    return res.shops || [];
  } catch (err) {
    console.warn('Fetch admin shop queue error:', err);
    return [];
  }
}

export async function reviewShopRegistration(
  shopId: string,
  action: 'approve' | 'reject',
  reason?: string
): Promise<{ success: boolean; message: string; shop?: Shop }> {
  const res = await apiClient.post(`/shops/${shopId}/review`, { action, reason });
  return res;
}
