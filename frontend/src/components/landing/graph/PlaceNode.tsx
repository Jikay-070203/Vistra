'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import Icon from '@/components/ui/Icon';
import styles from './PlaceGraph.module.css';

export interface PlaceNodeData {
  id: string;
  label: string;
  shortLabel?: string;
  category: 'scenic' | 'dining' | 'stay' | 'culture';
  state?: string;
  isStart?: boolean;
  isEnd?: boolean;
  routeOrder?: number;
  isSelected?: boolean;
  isPendingConnect?: boolean;
  isDimmed?: boolean;
  [key: string]: unknown;
}

export default function PlaceNode({ data }: { data: PlaceNodeData }) {
  const {
    label,
    shortLabel,
    category,
    isStart,
    isEnd,
    routeOrder,
    isSelected,
    isPendingConnect,
    isDimmed,
  } = data;

  const getCategoryColor = () => {
    switch (category) {
      case 'scenic':
        return '#08B3C6';
      case 'dining':
        return '#E7AD2E';
      case 'stay':
        return '#205BD6';
      case 'culture':
        return '#10E4D0';
      default:
        return '#08B3C6';
    }
  };

  const getCategoryIcon = () => {
    switch (category) {
      case 'scenic':
        return 'landscape';
      case 'dining':
        return 'restaurant';
      case 'stay':
        return 'hotel';
      case 'culture':
        return 'palette';
      default:
        return 'place';
    }
  };

  return (
    <div
      className={`
        ${styles.customNode}
        ${isSelected ? styles.nodeSelected : ''}
        ${isPendingConnect ? styles.nodePendingConnect : ''}
        ${isDimmed ? styles.nodeDimmed : ''}
        ${isStart ? styles.nodeStartRoute : ''}
        ${isEnd ? styles.nodeEndRoute : ''}
      `}
    >
      {/* Handles for Edge Connections */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} id="left" />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} id="right" />

      {/* Order Badge in Draft/Journey mode */}
      {typeof routeOrder === 'number' && (
        <span className={styles.orderBadge}>{routeOrder}</span>
      )}

      {/* Category Icon */}
      <div
        className={styles.nodeCategoryIcon}
        style={{ backgroundColor: getCategoryColor() }}
      >
        <Icon name={getCategoryIcon()} className="size-3.5" />
      </div>

      {/* Text column */}
      <div className={styles.nodeTextCol}>
        <span className={styles.nodeLabel}>{label}</span>
        {shortLabel && <span className={styles.nodeSubLabel}>{shortLabel}</span>}
      </div>

      {/* Start / End Route Tags */}
      {isStart && <span className={`${styles.endpointTag} ${styles.startTag}`}>Điểm đầu</span>}
      {isEnd && <span className={`${styles.endpointTag} ${styles.endTag}`}>Điểm cuối</span>}
    </div>
  );
}
