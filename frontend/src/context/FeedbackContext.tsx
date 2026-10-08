'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
} from 'react';
import {
  FeedbackTicket,
  FeedbackCategory,
  TicketSeverity,
  TicketStatus,
} from '@/types/feedback';
export type { FeedbackTicket };
import {
  createFeedback,
  getMyFeedback,
  getAdminFeedback,
  getFeedbackCounts,
  rateFeedback,
  classifyFeedback,
  replyFeedback,
} from '@/services/feedbackService';
import type {
  AdminFeedbackPatchDto,
  AdminFeedbackQuery,
  FeedbackCounts,
  FeedbackTicketView,
  FeedbackStatus,
  StaffReplyView,
} from '@/types/feedbackApi';
import { useUserAuth } from '@/lib/userAuth';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface ActiveQuery {
  page: number;
  pageSize: number;
  isAdmin?: boolean;
  q?: string;
  status?: FeedbackStatus;
}

interface LiveIdentity {
  id: string | null;
  role: string | null;
  isLoggedIn: boolean;
  key: string;
}

interface FeedbackContextType {
  tickets: FeedbackTicket[];
  counts: FeedbackCounts | null;
  countsLoading: boolean;
  countsError: string | null;
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  addTicket: (params: {
    subject: string;
    description: string;
    userName?: string;
    userEmail?: string;
    routeOrigin?: string;
    category?: FeedbackCategory;
    severity?: TicketSeverity;
  }) => Promise<FeedbackTicket>;
  updateTicketClassification: (
    id: string,
    category?: FeedbackCategory,
    severity?: TicketSeverity,
    status?: TicketStatus
  ) => Promise<FeedbackTicket>;
  addStaffReply: (
    ticketId: string,
    replyText: string,
    newStatus?: TicketStatus
  ) => Promise<{ ticket: FeedbackTicket; statusUpdateError?: string }>;
  rateStaffAnswer: (ticketId: string, rating: number, feedback?: string) => Promise<void>;
  getTicketById: (id: string) => FeedbackTicket | undefined;
  refreshCounts: () => Promise<FeedbackCounts | null>;
  loadTickets: (params?: {
    page?: number;
    pageSize?: number;
    isAdmin?: boolean;
    q?: string;
    status?: FeedbackStatus;
  }) => Promise<void>;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

function mapTicketViewToTicket(
  view: FeedbackTicketView,
  fallbackUser?: { name?: string; email?: string }
): FeedbackTicket {
  return {
    id: view.id,
    subject: view.subject,
    description: view.description,
    userName: fallbackUser?.name || '',
    userEmail: fallbackUser?.email || '',
    routeOrigin: view.routeOrigin,
    createdAt: view.createdAt,
    updatedAt: view.updatedAt,
    category: (view.category as FeedbackCategory) || undefined,
    severity: (view.severity as TicketSeverity) || undefined,
    status: view.status,
    staffReplies: (view.staffReplies || []).map((r: StaffReplyView) => ({
      id: r.id,
      senderName: r.senderName || '',
      senderRole: r.senderRole || '',
      message: r.message,
      timestamp: r.timestamp,
    })),
    userAnswerRating: view.userAnswerRating ?? undefined,
    ratingFeedback: view.ratingFeedback ?? undefined,
  };
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn } = useUserAuth();

  const userId = user?.id ?? null;
  const userRole = user?.role ?? null;
  const currentIdentityKey = isLoggedIn && userId ? `${userId}:${userRole}` : 'anonymous';
  const isAdmin = isLoggedIn && userRole === 'admin';

  // Initial state owns initial pending state for counts when admin
  const [tickets, setTickets] = useState<FeedbackTicket[]>([]);
  const [counts, setCounts] = useState<FeedbackCounts | null>(null);
  const [countsLoading, setCountsLoading] = useState<boolean>(isAdmin);
  const [countsError, setCountsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Render-phase state adjustment for identity changes:
  // Immediately hides and resets old-identity state before children render without render ref mutation
  const [prevIdentityKey, setPrevIdentityKey] = useState<string>(currentIdentityKey);
  if (prevIdentityKey !== currentIdentityKey) {
    setPrevIdentityKey(currentIdentityKey);
    setTickets([]);
    setCounts(null);
    setCountsLoading(isAdmin);
    setCountsError(null);
    setLoading(false);
    setError(null);
    setPage(1);
    setTotal(0);
    setTotalPages(1);
  }

  // Live committed identity ref: updated synchronously in layout effect before child passive effects run
  const liveIdentityRef = useRef<LiveIdentity>({
    id: userId,
    role: userRole,
    isLoggedIn,
    key: currentIdentityKey,
  });

  const currentScopeRef = useRef<'admin' | 'profile' | null>(null);

  // Separate counters for list, count, and mutation requests
  const listGenRef = useRef(0);
  const countsGenRef = useRef(0);
  const mutationGenRef = useRef(0);

  const activeQueryRef = useRef<ActiveQuery | null>(null);

  // Synchronously update live committed identity and invalidate in-flight operations before child effects run
  useIsomorphicLayoutEffect(() => {
    const isTransition = liveIdentityRef.current.key !== currentIdentityKey;
    liveIdentityRef.current = {
      id: userId,
      role: userRole,
      isLoggedIn,
      key: currentIdentityKey,
    };

    if (isTransition) {
      listGenRef.current += 1;
      countsGenRef.current += 1;
      mutationGenRef.current += 1;
      currentScopeRef.current = null;
      activeQueryRef.current = null;
    }

    return () => {
      // Invalidate live requests on identity transition or unmount
      listGenRef.current += 1;
      countsGenRef.current += 1;
      mutationGenRef.current += 1;
    };
  }, [userId, userRole, isLoggedIn, currentIdentityKey]);

  // Initial and identity-driven counts fetch:
  // Initial state owns initial pending (setCountsLoading initialized to isAdmin).
  // This effect performs ONLY async response writes, satisfying lint rules without synchronous setState calls.
  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const startGen = countsGenRef.current;
    const startKey = currentIdentityKey;

    getFeedbackCounts()
      .then((res) => {
        if (countsGenRef.current === startGen && liveIdentityRef.current.key === startKey) {
          setCounts(res.data);
          setCountsError(null);
        }
      })
      .catch((err: unknown) => {
        if (countsGenRef.current === startGen && liveIdentityRef.current.key === startKey) {
          setCounts(null);
          setCountsError(
            err instanceof Error ? err.message : 'Không thể tải số liệu phản hồi quản trị.'
          );
        }
      })
      .finally(() => {
        if (countsGenRef.current === startGen && liveIdentityRef.current.key === startKey) {
          setCountsLoading(false);
        }
      });
  }, [isAdmin, currentIdentityKey]);

  // Event-driven refresh starts loading explicitly
  const refreshCounts = useCallback(async (): Promise<FeedbackCounts | null> => {
    const live = liveIdentityRef.current;
    if (!live.isLoggedIn || live.role !== 'admin') {
      setCounts(null);
      setCountsError(null);
      setCountsLoading(false);
      return null;
    }
    const gen = ++countsGenRef.current;
    const startKey = live.key;
    setCountsLoading(true);
    setCountsError(null);
    try {
      const res = await getFeedbackCounts();
      if (countsGenRef.current !== gen || liveIdentityRef.current.key !== startKey) return null;
      setCounts(res.data);
      setCountsError(null);
      return res.data;
    } catch (err: unknown) {
      if (countsGenRef.current !== gen || liveIdentityRef.current.key !== startKey) return null;
      setCounts(null);
      const msg = err instanceof Error ? err.message : 'Không thể tải số liệu phản hồi quản trị.';
      setCountsError(msg);
      return null;
    } finally {
      if (countsGenRef.current === gen && liveIdentityRef.current.key === startKey) {
        setCountsLoading(false);
      }
    }
  }, []);

  const loadTickets = useCallback(
    async (params?: {
      page?: number;
      pageSize?: number;
      isAdmin?: boolean;
      q?: string;
      status?: FeedbackStatus;
    }): Promise<void> => {
      // Explicitly reject stale invocation before initiating requests
      if (liveIdentityRef.current.key !== currentIdentityKey) {
        return;
      }

      const targetScope = params?.isAdmin ? 'admin' : 'profile';
      const reqPage = params?.page || 1;
      const reqPageSize = params?.pageSize || 20;

      // Scope changes invalidate mutations and clear previous state
      if (currentScopeRef.current !== targetScope) {
        currentScopeRef.current = targetScope;
        listGenRef.current += 1;
        mutationGenRef.current += 1;
        activeQueryRef.current = null;
        setTickets([]);
        setError(null);
        setPage(reqPage);
        setPageSize(reqPageSize);
        setTotal(0);
        setTotalPages(1);
      }

      const gen = ++listGenRef.current;
      const startIdentity = liveIdentityRef.current;

      // Every list start records LATEST intended query immediately
      activeQueryRef.current = {
        page: reqPage,
        pageSize: reqPageSize,
        isAdmin: params?.isAdmin,
        q: params?.q,
        status: params?.status,
      };

      setLoading(true);
      setError(null);

      try {
        if (params?.isAdmin) {
          if (!startIdentity.isLoggedIn || startIdentity.role !== 'admin') {
            throw new Error('Bạn không có quyền truy cập hòm thư quản trị.');
          }
          const query: AdminFeedbackQuery = { page: reqPage, pageSize: reqPageSize };
          if (params.q?.trim()) query.q = params.q.trim();
          if (params.status) query.status = params.status;

          const res = await getAdminFeedback(query);
          if (listGenRef.current !== gen || liveIdentityRef.current.key !== startIdentity.key) return;

          setTickets(res.data.items.map((i) => mapTicketViewToTicket(i)));
          setCounts(res.data.counts);
          setCountsError(null);
          setPage(res.data.page);
          setPageSize(res.data.pageSize);
          setTotal(res.data.total);
          setTotalPages(res.data.totalPages);

          // Normalize returned page/pageSize only if current generation without overriding latest intended query
          if (listGenRef.current === gen && activeQueryRef.current) {
            activeQueryRef.current.page = res.data.page;
            activeQueryRef.current.pageSize = res.data.pageSize;
          }
        } else {
          if (!startIdentity.isLoggedIn) {
            throw new Error('Vui lòng đăng nhập để xem phản hồi.');
          }
          const res = await getMyFeedback({ page: reqPage, pageSize: reqPageSize });
          if (listGenRef.current !== gen || liveIdentityRef.current.key !== startIdentity.key) return;

          setTickets(res.data.items.map((i) => mapTicketViewToTicket(i)));
          setPage(res.data.page);
          setPageSize(res.data.pageSize);
          setTotal(res.data.total);
          setTotalPages(res.data.totalPages);

          // Normalize returned page/pageSize only if current generation without overriding latest intended query
          if (listGenRef.current === gen && activeQueryRef.current) {
            activeQueryRef.current.page = res.data.page;
            activeQueryRef.current.pageSize = res.data.pageSize;
          }
        }
      } catch (err: unknown) {
        if (listGenRef.current !== gen || liveIdentityRef.current.key !== startIdentity.key) return;
        setTickets([]);
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách phản hồi.');
      } finally {
        if (listGenRef.current === gen && liveIdentityRef.current.key === startIdentity.key) {
          setLoading(false);
        }
      }
    },
    [currentIdentityKey]
  );

  const addTicket = async ({
    subject,
    description,
    routeOrigin = '/',
  }: {
    subject: string;
    description: string;
    userName?: string;
    userEmail?: string;
    routeOrigin?: string;
    category?: FeedbackCategory;
    severity?: TicketSeverity;
  }): Promise<FeedbackTicket> => {
    const startIdentity = liveIdentityRef.current;
    const startMutationGen = mutationGenRef.current;
    const startScope = currentScopeRef.current;

    if (!startIdentity.isLoggedIn) {
      throw new Error('Vui lòng đăng nhập để gửi phản hồi.');
    }
    const result = await createFeedback({
      subject: subject.trim(),
      description: description.trim(),
      routeOrigin: routeOrigin.trim() || '/',
    });

    const isStillValid =
      liveIdentityRef.current.key === startIdentity.key &&
      mutationGenRef.current === startMutationGen &&
      currentScopeRef.current === startScope;

    if (!isStillValid) {
      // Prevent old create from invoking old loadTickets or emitting state under lost identity
      throw new Error('Phiên làm việc đã thay đổi trong quá trình gửi phản hồi.');
    }

    const newTicket = mapTicketViewToTicket(result.data);

    // Mutation refresh must target latest intended query, never old accepted query
    if (activeQueryRef.current) {
      loadTickets(activeQueryRef.current).catch(() => {});
    }

    if (liveIdentityRef.current.role === 'admin') {
      refreshCounts().catch(() => {});
    }

    return newTicket;
  };

  const updateTicketClassification = async (
    id: string,
    category?: FeedbackCategory,
    severity?: TicketSeverity,
    status?: TicketStatus
  ): Promise<FeedbackTicket> => {
    const startIdentity = liveIdentityRef.current;
    const startMutationGen = mutationGenRef.current;
    const startScope = currentScopeRef.current;

    if (!startIdentity.isLoggedIn || startIdentity.role !== 'admin') {
      throw new Error('Bạn không có quyền thực hiện thao tác này.');
    }

    // Construct patch with ONLY supplied fields; do not fabricate/invent fields
    const validStatus = status && status !== 'closed' ? (status as FeedbackStatus) : undefined;
    const patch: AdminFeedbackPatchDto = {};
    if (category !== undefined) {
      patch.category = String(category);
    }
    if (severity !== undefined) {
      patch.severity = String(severity);
    }
    if (validStatus !== undefined) {
      patch.status = validStatus;
    }

    if (!Object.keys(patch).length) {
      throw new TypeError('Phải cung cấp ít nhất một trường để cập nhật.');
    }

    const result = await classifyFeedback(id, patch);

    const isStillValid =
      liveIdentityRef.current.key === startIdentity.key &&
      mutationGenRef.current === startMutationGen &&
      currentScopeRef.current === startScope;

    if (!isStillValid) {
      throw new Error('Phiên làm việc đã thay đổi trong quá trình cập nhật phiếu.');
    }

    const mapped = mapTicketViewToTicket(result.data);
    setTickets((prev) => prev.map((t) => (t.id === id ? mapped : t)));

    // After classification refresh active server query and page metadata because status membership and total may change
    if (activeQueryRef.current) {
      loadTickets(activeQueryRef.current).catch(() => {});
    }

    if (liveIdentityRef.current.role === 'admin') {
      refreshCounts().catch(() => {});
    }

    return mapped;
  };

  const addStaffReply = async (
    ticketId: string,
    replyText: string,
    newStatus: TicketStatus = 'answered'
  ): Promise<{ ticket: FeedbackTicket; statusUpdateError?: string }> => {
    const startIdentity = liveIdentityRef.current;
    const startMutationGen = mutationGenRef.current;
    const startScope = currentScopeRef.current;

    if (!startIdentity.isLoggedIn || startIdentity.role !== 'admin') {
      throw new Error('Bạn không có quyền thực hiện thao tác này.');
    }

    const replyRes = await replyFeedback(ticketId, { message: replyText.trim() });

    // Live identity validity check after reply await BEFORE sending classifyFeedback.
    // Never perform second mutation after logout/account change!
    const currentIdentityLive = liveIdentityRef.current;
    const currentMutationGenLive = mutationGenRef.current;
    const currentScopeLive = currentScopeRef.current;

    const isIdentityValid =
      currentIdentityLive.isLoggedIn &&
      currentIdentityLive.key === startIdentity.key &&
      currentIdentityLive.role === 'admin' &&
      currentMutationGenLive === startMutationGen &&
      currentScopeLive === startScope;

    const replyTicket = mapTicketViewToTicket(replyRes.data);

    if (!isIdentityValid) {
      // Identity lost or changed while reply was in flight; do NOT perform second mutation,
      // and do NOT emit into current state.
      throw new Error('Phiên làm việc đã thay đổi trong quá trình gửi phản hồi.');
    }

    // Identity is valid: write reply to state
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? replyTicket : t)));

    let finalTicket = replyTicket;
    let statusUpdateError: string | undefined;

    if (newStatus && newStatus !== 'closed' && newStatus !== replyRes.data.status) {
      try {
        const classRes = await classifyFeedback(ticketId, { status: newStatus as FeedbackStatus });
        // Check live identity again after classify await before writing local state
        if (
          liveIdentityRef.current.key === startIdentity.key &&
          mutationGenRef.current === startMutationGen
        ) {
          finalTicket = mapTicketViewToTicket(classRes.data);
          setTickets((prev) => prev.map((t) => (t.id === ticketId ? finalTicket : t)));
        }
      } catch (e) {
        statusUpdateError =
          e instanceof Error ? e.message : 'Không thể cập nhật trạng thái phiếu sau khi gửi trả lời.';
      }
    }

    const isStillValidBeforeReturn =
      liveIdentityRef.current.isLoggedIn &&
      liveIdentityRef.current.key === startIdentity.key &&
      liveIdentityRef.current.role === 'admin' &&
      mutationGenRef.current === startMutationGen &&
      currentScopeRef.current === startScope;

    if (!isStillValidBeforeReturn) {
      throw new Error('Phiên làm việc đã thay đổi trong quá trình gửi phản hồi.');
    }

    // After classification/reply refresh active server query and page metadata because status membership and total may change
    if (activeQueryRef.current) {
      loadTickets(activeQueryRef.current).catch(() => {});
    }
    refreshCounts().catch(() => {});

    return { ticket: finalTicket, statusUpdateError };
  };

  const rateStaffAnswer = async (
    ticketId: string,
    rating: number,
    feedback?: string
  ): Promise<void> => {
    const startIdentity = liveIdentityRef.current;
    const startMutationGen = mutationGenRef.current;
    const startScope = currentScopeRef.current;

    if (!startIdentity.isLoggedIn) {
      throw new Error('Vui lòng đăng nhập để gửi đánh giá.');
    }
    const result = await rateFeedback(ticketId, { rating, comment: feedback ?? null });
    const rated = result.data;

    const isStillValid =
      liveIdentityRef.current.isLoggedIn &&
      liveIdentityRef.current.key === startIdentity.key &&
      mutationGenRef.current === startMutationGen &&
      currentScopeRef.current === startScope;

    if (!isStillValid) {
      throw new Error('Phiên làm việc đã thay đổi trong quá trình gửi đánh giá.');
    }

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            userAnswerRating: rated.userAnswerRating,
            ratingFeedback: rated.ratingComment ?? feedback,
            updatedAt: rated.updatedAt,
          };
        }
        return t;
      })
    );
  };

  const getTicketById = (id: string) => {
    return tickets.find((t) => t.id === id);
  };

  return (
    <FeedbackContext.Provider
      value={{
        tickets,
        counts,
        countsLoading,
        countsError,
        loading,
        error,
        page,
        pageSize,
        total,
        totalPages,
        addTicket,
        updateTicketClassification,
        addStaffReply,
        rateStaffAnswer,
        getTicketById,
        refreshCounts,
        loadTickets,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}
