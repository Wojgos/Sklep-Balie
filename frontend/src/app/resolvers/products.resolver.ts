import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { forkJoin, map } from 'rxjs';
import { ApiService } from '../services/api.service';
import { Product, Category } from '../models';

export interface ProductsResolverData {
  products: Product[];
  categories: Category[];
}

export const productsResolver: ResolveFn<ProductsResolverData> = (route, state) => {
  const apiService = inject(ApiService);
  
  return forkJoin({
    products: apiService.getAllProducts(),
    categories: apiService.getAllCategories()
  });
};
