import { api } from './client'

export interface Category {
  id: string
  name: string
  detailId: string | null
}

/**
 * Get all categories
 * @returns array of all non soft-deleted categories
 */
export function getCategories() {
  return api.get<Category[]>('/categories/get-categories')
}
/**
 * Get only parent categories
 * @param 
 * @returns array of all non soft-deleted main categories (no subcategories)
 */
export function getParentCategories() {
  return api.get<Category[]>('/categories/get-categories-parents')
}
/**
 * Get only sub-categories
 * @returns array of all non soft-deleted sub-categories (no main categories)
 */
export function getDetailedCategories() {
  return api.get<Category[]>('/categories/get-categories-detailed')
}
