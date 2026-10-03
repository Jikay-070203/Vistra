/**
 * Small frontend API worker facade.
 * Components can call this facade instead of knowing the Railway URL or auth header.
 */
import { api, post } from './api'
import type { Destination, Place, Trip, TripRequest } from './types'

export const backendWorker = {
  health: () => api<{ status: string; version: string }>('/health'),
  destinations: () => api<{ items: Destination[] }>('/destinations'),
  places: (destination: string, limit = 12) =>
    api<{ items: Place[]; total: number }>(`/places?destination=${encodeURIComponent(destination)}&limit=${limit}`),
  createTrip: (request: TripRequest, generateItinerary = true) =>
    post<Trip>(`/trips?generate_itinerary=${generateItinerary}`, request),
  trip: (id: string) => api<Trip>(`/trips/${encodeURIComponent(id)}`),
}
