export type FeedbackStatus = 'unassigned' | 'in_progress' | 'answered' | 'resolved';

export interface StaffReplyView {
  id: string;
  senderName: null;
  senderRole: string;
  message: string;
  timestamp: string;
}

export interface FeedbackTicketView {
  id: string;
  subject: string;
  description: string;
  routeOrigin: string;
  category: string | null;
  severity: string | null;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
  userAnswerRating: number | null;
  ratingFeedback: string | null;
  staffReplies: StaffReplyView[];
}

export interface FeedbackPageView {
  items: FeedbackTicketView[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface FeedbackCounts {
  unassigned: number;
  inProgress: number;
  answered: number;
  resolved: number;
  total: number;
  answeredOrResolved: number;
}

export interface AdminFeedbackPageView extends FeedbackPageView { counts: FeedbackCounts }

export interface FeedbackListQuery { page: number; pageSize: number }
export interface AdminFeedbackQuery extends FeedbackListQuery { q?: string; status?: FeedbackStatus }
export interface FeedbackCreateDto { subject: string; description: string; routeOrigin: string }
export interface FeedbackRatingDto { rating: number; comment?: string | null }
export interface FeedbackRatingView {
  ticketId: string;
  userAnswerRating: number;
  ratingComment: string | null;
  updatedAt: string;
}
export interface AdminFeedbackPatchDto {
  category?: string | null;
  severity?: string | null;
  status?: FeedbackStatus;
}
