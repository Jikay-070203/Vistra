'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRecommendations } from '@/services/destinationService';
import type { DestinationRecommendationView } from '@/types/recommendationApi';

export function useDestinationsController() {
  const router = useRouter();
  const [destinations, setDestinations] = useState<DestinationRecommendationView[]>([]);
  const [isLoadingRecommendations, setLoading] = useState(true);
  const [recommendationsError, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [selectedForCompare, setSelected] = useState<string[]>([]);
  const [expandedDetails, setExpanded] = useState<string | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) { setLoading(true); setError(null); } });
    getRecommendations().then(response => {
      if (!active || !response.data) return;
      const items = response.data.items;
      setDestinations(items);
      setSelected(previous => previous.filter(id => items.some(item => item.id === id)));
    }).catch((cause: unknown) => {
      if (active) { setDestinations([]); setError(cause instanceof Error ? cause.message : 'Không thể tải điểm đến.'); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  return {
    destinations, isLoadingRecommendations, recommendationsError, retryRecommendations: () => setReload(value => value + 1),
    selectedForCompare, expandedDetails, showComparisonModal, setShowComparisonModal,
    comparedDestinations: destinations.filter(item => selectedForCompare.includes(item.id)),
    toggleCompare: (id: string) => setSelected(previous => previous.includes(id) ? previous.filter(item => item !== id) : previous.length < 3 ? [...previous, id] : previous),
    toggleDetails: (id: string) => setExpanded(previous => previous === id ? null : id),
    handleSelectDestination: (slug: string) => router.push(`/create-trip?province=${encodeURIComponent(slug)}`),
  };
}
