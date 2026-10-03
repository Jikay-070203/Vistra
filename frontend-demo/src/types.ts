export interface Destination { id: number; slug: string; display_name: string; center_lat: number; center_lon: number; places: number; schedulable: number }
export type Kind = 'attraction' | 'food' | 'cafe' | 'stay' | 'activity' | 'other'
export interface Source { id: number; source_url: string; name: string; last_seen_at: string }
export interface Place { id: number; display_name: string; destination_id: number; address: string | null; latitude: number; longitude: number; kind: Kind; quality_status: string; indoor_outdoor: string; suggested_duration_min: number | null; opening_hours_unknown: number; price_unknown: number; sources?: Source[]; prices?: {min_vnd: number; max_vnd: number; unit: string}[]; opening_intervals?: {weekday: number; opens_local: string; closes_local: string}[] }
export interface TripRequest { destination: string; start_date: string; days: number; people: number; budget_vnd: number; budget_scope: 'total' | 'per_person'; transport: 'car'; pace: 'relaxed' | 'normal' | 'busy'; interests: Kind[]; must_visit: number[]; allow_unverified?: boolean; lodging_total_vnd?: number | null; transport_total_vnd?: number | null }
export interface Activity { place_id: number; name: string; kind: Kind; day: number; start_at: string; end_at: string; latitude: number; longitude: number; notes: string[]; estimated_cost: {min_vnd: number; max_vnd: number} | null }
export interface Budget { categories: Record<string, {min_vnd: number; max_vnd: number; unknown_items: number}>; known_max_vnd: number; known_min_vnd: number; complete: boolean; limit_vnd: number; known_over_budget_vnd: number }
export interface Itinerary { version: number; provisional?: boolean; activities: Activity[]; route_legs: { geometry: {type: string; coordinates: number[][]} | null; day: number; to_place_id: number; duration_min: number; distance_km: number }[]; budget: Budget; warnings: string[]; weather: {type: string} }
export interface TripSummary { id: string; destination_id: number; current_version: number; created_at: string }
export interface Trip extends TripSummary { request: TripRequest; itinerary: Itinerary | null; recommendations: Partial<Record<Kind, Place[]>>; generation_error?: string | {code?:string} | null }
export interface Expense { id: string; category: string; amount_vnd: number; occurred_at: string; note: string }
export interface Stop { place_id: number; day: number; start_time?: string }
export interface Preview { preview_id: string; base_version: number; itinerary: Itinerary; known_cost_delta_vnd: number }
