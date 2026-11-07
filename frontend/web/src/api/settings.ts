import { api } from './client'

export interface Settings {
  id: string
  userId: string
  createdAt: string
  deletedAt: string | null
  inactivityTimeout: number
  transactionPageSize: number
  autoSync: boolean
  automaticReports: string
  autoReportsFrequency: AutoReportsFrequency
  autoReportsMethod: string
  notificationMethod: string
  notificationType: string
}

export const AUTO_REPORTS_FREQUENCY = ['None', 'Weekly', 'Monthly'] as const
export type AutoReportsFrequency = (typeof AUTO_REPORTS_FREQUENCY)[number]

/**
 * Get the user's settings
 * @returns the user's settings row
 * @throws {ApiError} if the request fails, including when the user has no settings row
 */
export function getSettings(): Promise<Settings> {
  return api.get<Settings>(`/settings/get-settings`)
}

export type SettingsRequest = Omit<Settings, 'id' | 'userId' | 'createdAt' | 'deletedAt'>

/**
 * Update the user's settings
 * @remarks Every field is overwritten, so send the full object (e.g. from `getSettings`) with your changes applied, not just the changed fields
 * @param settings - object of type `SettingsRequest`
 * @throws {ApiError} if the request fails
 */
export function updateSettings(settings: SettingsRequest): Promise<void> {
  return api.patch(`/settings/update-settings`, settings)
}

/**
 * Delete the user's settings
 * @throws {ApiError} if the request fails
 */
export function deleteSettings(): Promise<void> {
  return api.delete(`/settings/delete-settings`)
}
