import { FC, MouseEvent } from 'react';
import { ChevronDown, AlertCircle, Loader2, GripVertical } from 'lucide-react';
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

  const getStateColor = () => {
    if (!isBackendUp && backendHealth !== null) return 'var(--danger)';
    switch (state) {
      case 'working':
        return 'var(--accent)';
      case 'needs_approval':
        return 'var(--warning)';
      case 'error':
        return 'var(--danger)';
      case 'connecting':
        return 'var(--text-muted)';
      case 'ready':
      default:
        return 'var(--accent)';
    }
  };

  const getStateLabel = () => {
    if (!isBackendUp && backendHealth !== null) return 'Offline';
    switch (state) {
      case 'working':
        return 'Working...';
      case 'needs_approval':
        return 'Approval Needed';
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
        height: '46px',
        padding: '0 10px 0 8px',
        borderRadius: 'var(--radius-pill)',
        backgroundColor: 'rgba(21, 27, 35, 0.96)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-pill)',
        backdropFilter: 'blur(16px)',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Left: Drag Grip & Brand */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {/* Dedicated Drag Handle */}
        <div
          data-tauri-drag-region
          onMouseDown={handleStartDrag}
          onPointerDown={handleStartDrag}
          onClick={(e) => e.stopPropagation()}
          title="Drag to move JARVIS"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'grab',
            padding: '4px 2px',
            color: 'var(--text-muted)',
            borderRadius: '4px',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <GripVertical size={14} />
        </div>

        {/* Status Indicator & Mark (also draggable) */}
        <div
          data-tauri-drag-region
          onMouseDown={handleStartDrag}
          onPointerDown={handleStartDrag}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'grab',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {state === 'working' ? (
              <Loader2
                size={16}
                className="spin-working"
                style={{ color: getStateColor() }}
              />
            ) : (
              <>
                <div
                  style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    backgroundColor: getStateColor(),
                    boxShadow: `0 0 8px ${getStateColor()}`,
                  }}
                />
                {state === 'ready' && isBackendUp && (
                  <div
                    className="pulse-ring"
                    style={{
                      position: 'absolute',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: `1.5px solid ${getStateColor()}`,
                      opacity: 0.6,
                    }}
                  />
                )}
              </>
            )}
          </div>

          <span
            data-tauri-drag-region
            style={{
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'var(--text-primary)',
            }}
          >
            JARVIS
          </span>
        </div>
      </div>

      {/* State Badge & Chevron */}
      <div
        data-tauri-drag-region
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 500,
            padding: '2px 8px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            color: getStateColor(),
            border: `1px solid ${getStateColor()}25`,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {(!isBackendUp && backendHealth !== null) && <AlertCircle size={10} />}
          {getStateLabel()}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          aria-label="Expand JARVIS panel"
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: 0,
            transition: 'background-color 0.15s ease, color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <ChevronDown size={14} />
        </button>
      </div>
    </div>
  );
};
