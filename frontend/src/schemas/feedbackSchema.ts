import { list, nullable, number, oneOf, record, string } from '@/schemas/apiSchemaHelpers';
import type { AdminFeedbackPageView, FeedbackCounts, FeedbackPageView, FeedbackRatingView,
  FeedbackTicketView, StaffReplyView } from '@/types/feedbackApi';

const statuses = ['unassigned', 'in_progress', 'answered', 'resolved'] as const;

function optionalText(value: unknown, label: string): string | null {
  return nullable(value, string, label);
}

function integer(value: unknown, label: string): number {
  const parsed = number(value, label);
  if (!Number.isInteger(parsed) || parsed < 0) throw new TypeError(label + ' must be a non-negative integer');
  return parsed;
}

function parseReply(value: unknown): StaffReplyView {
  const raw = record(value, 'feedback reply');
  return { id: string(raw.id, 'reply.id'), senderName: null,
    senderRole: string(raw.senderRole, 'reply.senderRole'),
    message: string(raw.message, 'reply.message'),
    timestamp: string(raw.createdAt, 'reply.createdAt') };
}

export const feedbackTicketSchema = {
  parse(value: unknown): FeedbackTicketView {
    const raw = record(value, 'feedback ticket');
    const rating = raw.userAnswerRating === null ? null : integer(raw.userAnswerRating, 'ticket.userAnswerRating');
    if (rating !== null && (rating < 1 || rating > 5)) throw new TypeError('Invalid feedback rating');
    return {
      id: string(raw.id, 'ticket.id'), subject: string(raw.subject, 'ticket.subject'),
      description: string(raw.description, 'ticket.description'),
      routeOrigin: string(raw.routeOrigin, 'ticket.routeOrigin'),
      category: optionalText(raw.category, 'ticket.category'),
      severity: optionalText(raw.severity, 'ticket.severity'),
      status: oneOf(raw.status, statuses, 'ticket.status'),
      createdAt: string(raw.createdAt, 'ticket.createdAt'),
      updatedAt: string(raw.updatedAt, 'ticket.updatedAt'),
      userAnswerRating: rating,
      ratingFeedback: optionalText(raw.ratingComment, 'ticket.ratingComment'),
      staffReplies: list(raw.replies, 'ticket.replies').map(parseReply),
    };
  },
};

export const feedbackPageSchema = {
  parse(value: unknown): FeedbackPageView {
    const raw = record(value, 'feedback page');
    return { items: list(raw.items, 'feedback.items').map(feedbackTicketSchema.parse),
      page: integer(raw.page, 'feedback.page'), pageSize: integer(raw.pageSize, 'feedback.pageSize'),
      total: integer(raw.total, 'feedback.total'), totalPages: integer(raw.totalPages, 'feedback.totalPages') };
  },
};

export const adminFeedbackPageSchema = {
  parse(value: unknown): AdminFeedbackPageView {
    const raw = record(value, 'admin feedback page');
    const counts = record(raw.counts, 'admin feedback counts');
    const unassigned = integer(counts.unassigned, 'counts.unassigned');
    const inProgress = integer(counts.in_progress, 'counts.in_progress');
    const answered = integer(counts.answered, 'counts.answered');
    const resolved = integer(counts.resolved, 'counts.resolved');
    const values: FeedbackCounts = { unassigned, inProgress, answered, resolved,
      total: unassigned + inProgress + answered + resolved,
      answeredOrResolved: answered + resolved };
    return { ...feedbackPageSchema.parse(raw), counts: values };
  },
};

export const feedbackMutationSchema = {
  parse(value: unknown): FeedbackTicketView {
    return feedbackTicketSchema.parse(record(value, 'feedback mutation').ticket);
  },
};

export const feedbackRatingSchema = {
  parse(value: unknown): FeedbackRatingView {
    const raw = record(value, 'feedback rating');
    const rating = integer(raw.userAnswerRating, 'rating.userAnswerRating');
    if (rating < 1 || rating > 5) throw new TypeError('Invalid feedback rating');
    return { ticketId: string(raw.ticketId, 'rating.ticketId'), userAnswerRating: rating,
      ratingComment: optionalText(raw.ratingComment, 'rating.ratingComment'),
      updatedAt: string(raw.updatedAt, 'rating.updatedAt') };
  },
};
