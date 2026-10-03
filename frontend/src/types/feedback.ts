export type FeedbackCategory =
  | 'ux_issue'
  | 'logic_issue'
  | 'function_issue'
  | 'improvement_suggestion'
  | 'Vấn đề giao diện (UX)'
  | 'Lỗi logic hành trình'
  | 'Chức năng chưa hoạt động'
  | 'Đề xuất cải tiến';

export type TicketSeverity =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'Thấp'
  | 'Trung bình'
  | 'Cao'
  | 'Nghiêm trọng';

export type TicketStatus =
  | 'unassigned'
  | 'in_progress'
  | 'answered'
  | 'resolved'
  | 'closed';

export interface StaffReply {
  id: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: string;
}

export interface FeedbackTicket {
  id: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  subject: string;
  description: string;
  routeOrigin?: string; // where the feedback was submitted from (e.g. /planner, /community)
  createdAt: string;
  updatedAt: string;
  category?: FeedbackCategory; // Classified by staff/admin in ADM-05
  severity?: TicketSeverity;   // Staff-assigned severity
  status: TicketStatus;
  staffReplies: StaffReply[];
  userAnswerRating?: number;   // 1 to 5 stars, rated by user only after an answer is available
  ratingFeedback?: string;     // optional user comment on the answer
}
