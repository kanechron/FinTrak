import { api } from "./client";

export interface Category {
  id: string;
  name: string;
  detailId: string | null;
}

export function getCategories() {
  return api.get<Category[]>("/categories/get-categories");
}
