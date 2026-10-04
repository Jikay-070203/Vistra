'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { FeedbackTicket, FeedbackCategory, TicketSeverity, TicketStatus, StaffReply } from '@/types/feedback';
import { INITIAL_FEEDBACK_TICKETS } from '@/data/mockFeedback';

interface FeedbackContextType {
  tickets: FeedbackTicket[];
  addTicket: (params: {
    subject: string;
    description: string;
    userName?: string;
    userEmail?: string;
    routeOrigin?: string;
    category?: FeedbackCategory;
    severity?: TicketSeverity;
  }) => FeedbackTicket;
  updateTicketClassification: (
    id: string,
    category: FeedbackCategory,
    severity: TicketSeverity,
    status?: TicketStatus
  ) => void;
  addStaffReply: (ticketId: string, replyText: string, newStatus?: TicketStatus) => void;
  rateStaffAnswer: (ticketId: string, rating: number, feedback?: string) => void;
  getTicketById: (id: string) => FeedbackTicket | undefined;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

const STORAGE_KEY = 'vistra_demo_feedback_tickets_v1';

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<FeedbackTicket[]>(INITIAL_FEEDBACK_TICKETS);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTickets(parsed);
          }
        }
      } catch {
        // LocalStorage not available or parse error, use defaults
      } finally {
        setIsInitialized(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
      } catch {
        // quota exceeded or disabled
      }
    }
  }, [tickets, isInitialized]);

  const addTicket = ({
    subject,
    description,
    userName = 'Du khách VISTRA',
    userEmail = 'traveler@vistra.vn',
    routeOrigin = '/',
    category,
    severity,
  }: {
    subject: string;
    description: string;
    userName?: string;
    userEmail?: string;
    routeOrigin?: string;
    category?: FeedbackCategory;
    severity?: TicketSeverity;
  }): FeedbackTicket => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newId = `FB-${1000 + tickets.length + 1}`;
    const newTicket: FeedbackTicket = {
      id: newId,
      userName,
      userEmail,
      subject,
      description,
      routeOrigin,
      category,
      severity,
      createdAt: now,
      updatedAt: now,
      status: 'unassigned',
      staffReplies: [],
    };

    setTickets((prev) => [newTicket, ...prev]);
    return newTicket;
  };

  const updateTicketClassification = (
    id: string,
    category: FeedbackCategory,
    severity: TicketSeverity,
    status?: TicketStatus
  ) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            category,
            severity,
            status: status || t.status,
            updatedAt: now,
          };
        }
        return t;
      })
    );
  };

  const addStaffReply = (ticketId: string, replyText: string, newStatus: TicketStatus = 'answered') => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newReply: StaffReply = {
      id: `reply-${Date.now()}`,
      senderName: 'Võ Minh Quân',
      senderRole: 'Kỹ sư Vận hành AI',
      message: replyText,
      timestamp: now,
    };

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: newStatus,
            updatedAt: now,
            staffReplies: [...t.staffReplies, newReply],
          };
        }
        return t;
      })
    );
  };

  const rateStaffAnswer = (ticketId: string, rating: number, feedback?: string) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            userAnswerRating: rating,
            ratingFeedback: feedback,
            updatedAt: now,
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
        addTicket,
        updateTicketClassification,
        addStaffReply,
        rateStaffAnswer,
        getTicketById,
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
