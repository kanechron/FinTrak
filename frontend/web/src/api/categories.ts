import { api } from './client'

export interface Category {
  id: string
  name: string
  detailId: string | null
}

export function getCategories() {
  return api.get<Category[]>('/categories/get-categories')
}
export function getParentCategories() {
  return api.get<Category[]>('/categories/get-categories-parents')
}
export function getDetailedCategories() {
  return api.get<Category[]>('/categories/get-categories-detailed')
}
