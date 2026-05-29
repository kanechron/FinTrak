import { api } from "./client";

export interface Category {
    id: string;
    name: string;
    isSystem: boolean;
}

export function getCategories() {
    return api.get<Category[]>("/categories/get-categories");
}