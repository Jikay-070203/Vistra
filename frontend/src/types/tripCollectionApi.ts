export interface TripCardRaw {
  id: string;
  title: string;
  origin: { latitude: number; longitude: number } | null;
  destination: string;
  coverImageUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  durationDays: number;
  budgetMinVnd: number | null;
  budgetMaxVnd: number | null;
  estimatedCostVnd: number | null;
  status: string;
  isPublished: boolean;
  updatedAt: string | null;
  tags: string[];
  likesCount: number;
  likedByMe: boolean;
}

export interface TripCardView {
  id: string;
  title: string;
  origin: TripCardRaw['origin'];
  destination: string;
  coverImageUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  durationDays: number;
  budgetMinVnd: number | null;
  budgetMaxVnd: number | null;
  estimatedCostVnd: number | null;
  status: string;
  isPublished: boolean;
  updatedAt: string | null;
  tags: string[];
  likesCount: number;
  likedByMe: boolean;
}

export interface PagedTripCardsView {
  items: TripCardView[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TripPageQuery { page: number; pageSize: number }
export interface CommunityTripQuery extends TripPageQuery {
  q?: string;
  /** Must be a verified backend destination slug, not a province name/code. */
  provinceSlug?: string;
  durationDays?: number;
  tag?: string;
  budgetMinVnd?: number;
  budgetMaxVnd?: number;
  likedByMe?: boolean;
}

export interface TripLikeView { tripId: string; liked: boolean; likesCount: number }
