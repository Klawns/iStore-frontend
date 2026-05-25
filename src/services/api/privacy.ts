import { api } from './client'
import type {
  PrivacyExportResponse,
  PrivacyRequestPayload,
  PrivacyRequestResponse,
} from './types'

export async function listPrivacyRequests() {
  const { data } = await api.get<PrivacyRequestResponse[]>('/privacy/requests')
  return data
}

export async function createPrivacyRequest(payload: PrivacyRequestPayload) {
  const { data } = await api.post<PrivacyRequestResponse>('/privacy/requests', payload)
  return data
}

export async function exportPrivacyData() {
  const { data } = await api.get<PrivacyExportResponse>('/privacy/export')
  return data
}
