import type { Product } from '../api/types';
import { productLabel } from '../lib/status';

export function ProductChip({ product }: { product: Product }) {
  return <span className={`chip chip-${product}`}>{productLabel(product)}</span>;
}
