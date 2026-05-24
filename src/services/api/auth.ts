import { api } from './client'
import type { AuthRequest, CreateUserRequest, UserResponse } from './types'

export async function signIn(payload: AuthRequest) {
  await api.post('/auth/sign-in', payload)
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
  return data
}

