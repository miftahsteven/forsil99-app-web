import { apiClient } from './apiClient';
import { Product, Shop } from '@/types';

export async function fetchProducts(categoryId?: string, search?: string): Promise<Product[]> {
  try {
    const params = new URLSearchParams();
    if (categoryId && categoryId !== 'all') params.append('categoryId', categoryId);
    if (search) params.append('search', search);

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

export async function fetchShops(): Promise<Shop[]> {
  try {
    const res = await apiClient.get('/shops');
    return res.shops || [];
  } catch {
    return [];
  }
}
