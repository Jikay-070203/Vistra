'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_DESTINATIONS } from '@/data/mockData';
import { useDemoPlan } from '@/context/DemoPlanContext';

export function useDestinationsController() {
  const router = useRouter();
  const { setActivePlanId } = useDemoPlan();

  const [selectedForCompare, setSelectedForCompare] = useState<string[]>(['sapa', 'dalat']);
  const [expandedDetails, setExpandedDetails] = useState<string | null>('sapa');
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  const toggleCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      if (selectedForCompare.length <= 1) return;
      setSelectedForCompare(selectedForCompare.filter((item) => item !== id));
    } else {
      if (selectedForCompare.length >= 3) {
        setSelectedForCompare([selectedForCompare[1], selectedForCompare[2], id]);
      } else {
        setSelectedForCompare([...selectedForCompare, id]);
      }
    }
  };

  const toggleDetails = (id: string) => {
    setExpandedDetails(expandedDetails === id ? null : id);
  };

  const handleSelectDestination = (destName: string) => {
    // Select plan associated with destination or set default
    if (destName.toLowerCase().includes('sa pa')) {
      setActivePlanId('sapa-cloud-hunt');
    } else if (destName.toLowerCase().includes('đà lạt')) {
      setActivePlanId('dalat-pine-hills');
    }
    router.push('/planner');
  };

  const comparedDestinations = MOCK_DESTINATIONS.filter((d) => selectedForCompare.includes(d.id));

  return {
    destinations: MOCK_DESTINATIONS,
    selectedForCompare,
    expandedDetails,
    showComparisonModal,
    setShowComparisonModal,
    comparedDestinations,
    toggleCompare,
    toggleDetails,
    handleSelectDestination,
  };
}
