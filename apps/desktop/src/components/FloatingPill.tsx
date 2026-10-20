import { FC, MouseEvent } from 'react';
import { ChevronDown, GripVertical } from 'lucide-react';
import { AssistantState, HealthResponse } from '../types/jarvis';

interface FloatingPillProps {
  state: AssistantState;
  backendHealth: HealthResponse | null;
  onExpand: () => void;
}

export const FloatingPill: FC<FloatingPillProps> = ({
  state,
  backendHealth,
  onExpand,
}) => {
  const isBackendUp = backendHealth?.status === 'UP';

  // Native window drag via Tauri
  const handleStartDrag = async (e: MouseEvent) => {
    if (e.button === 0) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().startDragging();
      } catch (err) {
        console.error('Drag failed:', err);
      }
    }
  };

  const getRingColor = () => {
    if (!isBackendUp && backendHealth !== null) return 'var(--color-danger)';
    switch (state) {
      case 'working':
        return 'var(--color-accent)';
      case 'needs_approval':
        return 'var(--color-warning)';
      case 'error':
        return 'var(--color-danger)';
      case 'connecting':
        return 'var(--color-text-muted)';
      case 'ready':
      default:
        return 'var(--color-accent)';
    }
  };

  const getStateLabel = () => {
    if (!isBackendUp && backendHealth !== null) return 'Offline';
    switch (state) {
      case 'working':
        return 'Working...';
      case 'needs_approval':
        return 'Needs approval';
      case 'error':
        return 'Attention';
      case 'connecting':
        return 'Connecting...';
      case 'ready':
      default:
        return 'Ready';
    }
  };

  return (
    <div
      className="floating-pill-container"
      onClick={onExpand}
      title="Click to expand JARVIS (or drag from grip)"
      data-tauri-drag-region
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '310px',
        height: '56px',
        padding: '0 14px 0 8px',
        borderRadius: '9999px',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'none',
        cursor: 'pointer',
        boxSizing: 'border-box',
        outline: 'none',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* ─── Left Section: Grip + Hollow Ring + Brand ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        {/* Dedicated Drag Grip Handle */}
        <div
          data-tauri-drag-region
          onMouseDown={handleStartDrag}
          onPointerDown={handleStartDrag}
          onClick={(e) => e.stopPropagation()}
          title="Drag to reposition JARVIS"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'grab',
            padding: '4px 2px',
            color: 'var(--color-text-muted)',
            borderRadius: '4px',
            opacity: 0.6,
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
        >
          <GripVertical size={14} />
        </div>

        {/* Hollow Status Ring (Cortana-style per Section 5.1 of UI/UX Spec v2) */}
        <div
          data-tauri-drag-region
          onMouseDown={handleStartDrag}
          onPointerDown={handleStartDrag}
          style={{
            position: 'relative',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'grab',
          }}
        >
          <svg viewBox="0 0 30 30" width="30" height="30" aria-hidden="true" style={{ display: 'block' }}>
            <circle
              cx="15"
              cy="15"
              r="12"
              fill="none"
              stroke={getRingColor()}
              strokeWidth="2.8"
              className={state === 'working' ? 'spin-working' : ''}
              strokeDasharray={state === 'working' ? '40 25' : 'none'}
              style={{ transition: 'stroke 0.25s ease' }}
            />
          </svg>
        </div>

        {/* Wordmark & State Label (Figma reference: JARVIS 15px Semi Bold, label 11px) */}
        <div
          data-tauri-drag-region
          onMouseDown={handleStartDrag}
          onPointerDown={handleStartDrag}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            cursor: 'grab',
          }}
        >
          <span
            data-tauri-drag-region
            style={{
              fontSize: '15px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: 'var(--color-text-primary)',
              lineHeight: 1.15,
            }}
          >
            JARVIS
          </span>
          <span
            data-tauri-drag-region
            style={{
              fontSize: '11px',
              fontWeight: 400,
              color: 'var(--color-text-muted)',
              lineHeight: 1.2,
            }}
          >
            {getStateLabel()}
          </span>
        </div>
      </div>

      {/* ─── Right Section: Subtle Expand Affordance ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          aria-label="Expand JARVIS panel"
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: 0,
            transition: 'background-color 0.15s ease, color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.color = 'var(--color-text-muted)';
          }}
        >
          <ChevronDown size={14} />
        </button>
      </div>
    </div>
  );
};
