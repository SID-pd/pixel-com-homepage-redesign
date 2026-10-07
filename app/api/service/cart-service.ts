import { apiGet } from "./api-service";

export async function getCartCount(): Promise<number> {
  try {
    const res = await apiGet<any>(`order/user-order-cart`);
    if (res.status && res.data.cart_data) {
      return Array.isArray(res.data.cart_data) ? res.data.total : 0;
    }
    return 0;
  } catch {
    return 0;
  }
}
