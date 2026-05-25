import { api } from './client'
import type { AuthRequest, CreateUserRequest, DeleteOwnAccountRequest, UserResponse } from './types'

function isUserResponse(value: unknown): value is UserResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as UserResponse).id === 'number' &&
    typeof (value as UserResponse).email === 'string'
  )
}

export async function signIn(payload: AuthRequest) {
  await api.post('/auth/sign-in', payload)
  return getMe()
}

export async function signOut() {
  await api.post('/auth/sign-out')
}

export async function createUser(payload: CreateUserRequest) {
  const { data } = await api.post<UserResponse>('/users', payload)
  return data
}

export async function getMe() {
  const { data } = await api.get<UserResponse>('/users/me')

  if (!isUserResponse(data)) {
    throw new Error('Sessao invalida.')
  }

  return data
}

export async function deleteOwnAccount(payload: DeleteOwnAccountRequest) {
  await api.delete('/users/me', { data: payload })
}
