import type { ListQuery } from '../models/types'

export type NetworkSimulation = 'Normal' | '300 ms' | '800 ms' | '1500 ms' | 'Error'

let networkSimulation: NetworkSimulation = 'Normal'

export function setNetworkSimulation(mode: NetworkSimulation) {
  networkSimulation = mode
}

export function getNetworkSimulation() {
  return networkSimulation
}

function toQuery(params?: ListQuery): string {
  if (!params) return ''
  const usp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      usp.set(key, String(value))
    }
  })
  const q = usp.toString()
  return q ? `?${q}` : ''
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function apiGet<T>(path: string, params?: ListQuery): Promise<T> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api${path}${toQuery(params)}`, {
    headers: {
      Accept: 'application/json',
      'X-Network-Simulation': networkSimulation,
    },
  })

  if (!response.ok) {
    throw new ApiError(`Request failed (${response.status})`, response.status)
  }

  return response.json() as Promise<T>
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Network-Simulation': networkSimulation,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new ApiError(`Request failed (${response.status})`, response.status)
  }

  return response.json() as Promise<T>
}
