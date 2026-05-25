import { api } from './client'
import type { PrivacyExportResponse } from './types'

export async function exportPrivacyData() {
  const { data } = await api.get<PrivacyExportResponse>('/privacy/export')
  return data
}
