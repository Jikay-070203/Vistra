'use client';

import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MarkerType,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import PlaceNode, { PlaceNodeData } from './PlaceNode';
import { LANDING_PINS, GraphEdge } from '../landingDemo';
import styles from './PlaceGraph.module.css';

const nodeTypes = {
  placeNode: PlaceNode,
};

export type GraphDisplayMode = 'discovery' | 'chaotic' | 'pruned' | 'draft' | 'co_create';

interface PlaceGraphCanvasProps {
  mode: GraphDisplayMode;
  selectedNodeId?: string | null;
  pendingSourceId?: string | null;
  onSelectNode?: (nodeId: string) => void;
  userEdges?: GraphEdge[];
  onAddUserEdge?: (sourceId: string, targetId: string) => void;
  onCancelPending?: () => void;
  validationError?: string | null;
}

export default function PlaceGraphCanvas({
  mode,
  selectedNodeId,
  pendingSourceId,
  onSelectNode,
  userEdges = [],
  onAddUserEdge,
  onCancelPending,
  validationError,
}: PlaceGraphCanvasProps) {
  // 1. Calculate stable Node positions (scale 100x100 coords to 740x480 canvas)
  const nodes: Node<PlaceNodeData>[] = useMemo(() => {
    return LANDING_PINS.map((pin) => {
      // Map percentage to canvas coordinates
      const posX = 40 + (pin.coords.x / 100) * 640;
      const posY = 35 + (pin.coords.y / 100) * 420;

      const isStart = (mode === 'draft' || mode === 'pruned') && pin.id === 'pin-lake-garden';
      const isEnd = (mode === 'draft' || mode === 'pruned') && pin.id === 'pin-pine-ridge';

      let routeOrder: number | undefined;
      if (mode === 'draft') {
        const orderMap: Record<string, number> = {
          'pin-lake-garden': 1,
          'pin-corner-tea': 2,
          'pin-hillside-lodge': 3,
          'pin-creek-village': 4,
          'pin-craft-workshop': 5,
          'pin-pine-ridge': 6,
        };
        routeOrder = orderMap[pin.id];
      }

      const isSelected = selectedNodeId === pin.id;
      const isPendingConnect = pendingSourceId === pin.id;
      const isDimmed = mode === 'pruned' && pin.id === 'pin-sunset-hill';

      return {
        id: pin.id,
        type: 'placeNode',
        position: { x: posX, y: posY },
        data: {
          id: pin.id,
          label: pin.name,
          shortLabel: pin.shortLabel,
          category: pin.category,
          isStart,
          isEnd,
          routeOrder,
          isSelected,
          isPendingConnect,
          isDimmed,
        },
      };
    });
  }, [mode, selectedNodeId, pendingSourceId]);

  // 2. Compute Edges based on current GraphDisplayMode
  const edges: Edge[] = useMemo(() => {
    if (mode === 'discovery') {
      // V4-004A: Initial discovery matrix is edge-free
      return [];
    }

    if (mode === 'chaotic') {
      // V4-005A: Noisy initial graph connecting fragments
      const chaoticEdgeDefs = [
        { id: 'e-c-1', source: 'pin-lake-garden', target: 'pin-corner-tea' },
        { id: 'e-c-2', source: 'pin-corner-tea', target: 'pin-hillside-lodge' },
        { id: 'e-c-3', source: 'pin-corner-tea', target: 'pin-sunset-hill' },
        { id: 'e-c-4', source: 'pin-hillside-lodge', target: 'pin-creek-village' },
        { id: 'e-c-5', source: 'pin-creek-village', target: 'pin-craft-workshop' },
        { id: 'e-c-6', source: 'pin-craft-workshop', target: 'pin-pine-ridge' },
      ];

      return chaoticEdgeDefs.map((def) => ({
        id: def.id,
        source: def.source,
        target: def.target,
        animated: true,
        style: { stroke: '#08B3C6', strokeWidth: 2, strokeDasharray: '4 4' },
      }));
    }

    if (mode === 'pruned') {
      // V4-005B: Prune redundant branches, degree <= 2
      const prunedEdgeDefs = [
        { id: 'e-p-1', source: 'pin-lake-garden', target: 'pin-corner-tea' },
        { id: 'e-p-2', source: 'pin-corner-tea', target: 'pin-hillside-lodge' },
        { id: 'e-p-3', source: 'pin-hillside-lodge', target: 'pin-creek-village' },
        { id: 'e-p-4', source: 'pin-creek-village', target: 'pin-craft-workshop' },
        { id: 'e-p-5', source: 'pin-craft-workshop', target: 'pin-pine-ridge' },
      ];

      return prunedEdgeDefs.map((def) => ({
        id: def.id,
        source: def.source,
        target: def.target,
        animated: false,
        style: { stroke: '#08B3C6', strokeWidth: 2.5 },
      }));
    }

    if (mode === 'draft') {
      // V4-005B: Sequential ordered route
      const draftRouteDefs = [
        { id: 'e-d-1', source: 'pin-lake-garden', target: 'pin-corner-tea' },
        { id: 'e-d-2', source: 'pin-corner-tea', target: 'pin-hillside-lodge' },
        { id: 'e-d-3', source: 'pin-hillside-lodge', target: 'pin-creek-village' },
        { id: 'e-d-4', source: 'pin-creek-village', target: 'pin-craft-workshop' },
        { id: 'e-d-5', source: 'pin-craft-workshop', target: 'pin-pine-ridge' },
      ];

      return draftRouteDefs.map((def) => ({
        id: def.id,
        source: def.source,
        target: def.target,
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#205BD6',
          width: 14,
          height: 14,
        },
        style: { stroke: '#205BD6', strokeWidth: 3 },
      }));
    }

    if (mode === 'co_create') {
      // V4-006A: Base edges + User created edges
      const baseEdges: Edge[] = [
        {
          id: 'e-base-1',
          source: 'pin-lake-garden',
          target: 'pin-corner-tea',
          style: { stroke: '#08B3C6', strokeWidth: 2.5 },
        },
        {
          id: 'e-base-2',
          source: 'pin-creek-village',
          target: 'pin-craft-workshop',
          style: { stroke: '#08B3C6', strokeWidth: 2.5 },
        },
      ];

      const userFlowEdges: Edge[] = userEdges.map((e) => ({
        id: e.id,
        source: e.sourceId,
        target: e.targetId,
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#10E4D0',
          width: 16,
          height: 16,
        },
        style: { stroke: '#10E4D0', strokeWidth: 3.5 },
      }));

      return [...baseEdges, ...userFlowEdges];
    }

    return [];
  }, [mode, userEdges]);

  // Handle node click
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const clickedId = node.id;

      if (mode === 'co_create' && onAddUserEdge) {
        if (!pendingSourceId) {
          // Select endpoint A
          if (onSelectNode) onSelectNode(clickedId);
        } else {
          // Attempt to connect endpoint A to endpoint B
          if (clickedId === pendingSourceId) {
            // Clicked same node -> toggle or cancel
            if (onCancelPending) onCancelPending();
          } else {
            onAddUserEdge(pendingSourceId, clickedId);
          }
        }
        return;
      }

      if (onSelectNode) {
        onSelectNode(clickedId);
      }
    },
    [mode, pendingSourceId, onSelectNode, onAddUserEdge, onCancelPending]
  );

  const getModeLabel = () => {
    switch (mode) {
      case 'discovery':
        return 'Tín hiệu rời rạc · Chưa có liên kết';
      case 'chaotic':
        return 'Bản nháp ban đầu · Liên kết phân mảnh';
      case 'pruned':
        return 'Lọc bớt nhánh thừa · Bậc tối đa ≤ 2';
      case 'draft':
        return 'Lộ trình tuần tự · Rõ điểm đầu & cuối';
      case 'co_create':
        return 'Cùng xây · Chọn 2 điểm để tạo đường nối';
    }
  };

  const getStateDotClass = () => {
    switch (mode) {
      case 'discovery':
        return styles.stateDotDiscovery;
      case 'chaotic':
        return styles.stateDotNoisy;
      case 'pruned':
        return styles.stateDotPruned;
      case 'draft':
        return styles.stateDotDraft;
      case 'co_create':
        return styles.stateDotCoCreate;
    }
  };

  return (
    <div className={styles.graphContainer}>
      {/* State Badge Overlay */}
      <div className={styles.graphOverlayHeader}>
        <div className={styles.graphStateBadge}>
          <span className={`${styles.stateIndicatorDot} ${getStateDotClass()}`} />
          <span>{getModeLabel()}</span>
        </div>

        {mode === 'co_create' && pendingSourceId && (
          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="text-xs font-semibold text-[#0E1D4F] bg-white/90 px-3 py-1.5 rounded-full border border-[#0E1D4F]/10">
              Đã chọn điểm đầu: <strong>{LANDING_PINS.find((p) => p.id === pendingSourceId)?.shortLabel}</strong>. Nhấp điểm thứ hai để nối!
            </span>
            {onCancelPending && (
              <button
                type="button"
                onClick={onCancelPending}
                className="text-xs font-bold text-red-600 bg-white/90 hover:bg-red-50 px-2.5 py-1.5 rounded-full border border-red-200 transition-colors"
              >
                Hủy
              </button>
            )}
          </div>
        )}

        {validationError && (
          <div className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-full pointer-events-auto animate-bounce">
            {validationError}
          </div>
        )}
      </div>

      {/* Controlled React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable={false}
        nodesConnectable={false}
        zoomOnScroll={false}
        panOnScroll={false}
        panOnDrag={false}
        preventScrolling={false}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color="#08B3C6"
          className="opacity-25"
        />
      </ReactFlow>

      {/* Bottom Controls / Category Legend */}
      <div className={styles.graphControlsPanel}>
        <div className={styles.legendBar}>
          <div className="flex items-center gap-1.5">
            <span className={`${styles.legendDot} ${styles.legendScenic}`} />
            <span>Cảnh quan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`${styles.legendDot} ${styles.legendDining}`} />
            <span>Ẩm thực</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`${styles.legendDot} ${styles.legendStay}`} />
            <span>Lưu trú</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`${styles.legendDot} ${styles.legendCulture}`} />
            <span>Văn hóa</span>
          </div>
        </div>

        <div className="text-[11px] font-semibold text-[#556976] bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[#0E1D4F]/8 pointer-events-auto">
          7 điểm đến cố định · React Flow Canvas
        </div>
      </div>
    </div>
  );
}
