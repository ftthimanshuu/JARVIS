import { FC, useState, MouseEvent } from 'react';
import {
  ChevronUp,
  RefreshCw,
  Shield,
  Server,
  Mail,
  FileText,
  Clock,
  Send,
  Mic,
  Settings as SettingsIcon,
  CheckCircle2,
  AlertTriangle,
  Minus,
  X,
  ExternalLink,
  Calendar,
  FolderOpen,
  ArrowLeft,
  Sparkles,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { AssistantState, HealthResponse, ActivityItem } from '../types/jarvis';

type PanelView = 'home' | 'briefing' | 'draft' | 'settings';

interface ExpandedPanelProps {
  state: AssistantState;
  backendHealth: HealthResponse | null;
  onCollapse: () => void;
  onRefreshHealth: () => Promise<void>;
  isRefreshing: boolean;
}

export const ExpandedPanel: FC<ExpandedPanelProps> = ({
  state,
  backendHealth,
  onCollapse,
  onRefreshHealth,
  isRefreshing,
}) => {
  const [currentView, setCurrentView] = useState<PanelView>('home');
  const [inputValue, setInputValue] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [draftBody, setDraftBody] = useState(
    "Hi Sarah,\n\nThank you for reaching out regarding the final round interview. Tomorrow at 4:00 PM IST works great for me. I look forward to speaking with the engineering team.\n\nBest regards,\nHimanshu"
  );
  const [draftSaved, setDraftSaved] = useState(false);

  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: 'act-1',
      title: 'Tauri Desktop Shell initialized',
      timestamp: 'Just now',
      status: 'success',
      category: 'system',
      description: 'Frameless transparent overlay active with IPC bridge',
    },
    {
      id: 'act-2',
      title: 'Local Spring Boot health verified',
      timestamp: '1m ago',
      status: backendHealth?.status === 'UP' ? 'success' : 'pending',
      category: 'system',
      description: `Binding on 127.0.0.1:48765 (${backendHealth?.latencyMs || 0}ms)`,
    },
    {
      id: 'act-3',
      title: 'Per-session security token configured',
      timestamp: '2m ago',
      status: 'success',
      category: 'security',
      description: 'X-JARVIS-Token headers required for local backend access',
    },
  ]);

  const isBackendUp = backendHealth?.status === 'UP';

  // Native window drag handler
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

  const handleMinimize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    } catch {}
  };

  const handleClose = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    } catch {}
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const lower = inputValue.toLowerCase();
    if (lower.includes('email') || lower.includes('brief') || lower.includes('mail')) {
      setCurrentView('briefing');
    } else if (lower.includes('draft') || lower.includes('reply')) {
      setCurrentView('draft');
    } else if (lower.includes('setting') || lower.includes('key')) {
      setCurrentView('settings');
    }

    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      title: `Prompt: "${inputValue}"`,
      timestamp: 'Just now',
      status: isBackendUp ? 'success' : 'failed',
      category: 'system',
      description: isBackendUp
        ? 'Processed by local execution pipeline.'
        : 'Could not execute — local Spring Boot backend is offline.',
    };

    setActivities([newActivity, ...activities]);
    setInputValue('');
  };

  return (
    <div
      className="expanded-panel-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '400px',
        height: '580px',
        borderRadius: 'var(--radius-panel)',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-panel)',
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* ─── Header (Draggable) ─── */}
      <div
        data-tauri-drag-region
        onMouseDown={handleStartDrag}
        onPointerDown={handleStartDrag}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-elevated)',
          cursor: 'grab',
        }}
      >
        <div
          data-tauri-drag-region
          onMouseDown={handleStartDrag}
          onPointerDown={handleStartDrag}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {currentView !== 'home' ? (
            <button
              onClick={() => setCurrentView('home')}
              title="Back to home"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
              }}
            >
              <ArrowLeft size={16} />
            </button>
          ) : (
            <div
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                backgroundColor: isBackendUp ? 'var(--accent)' : 'var(--danger)',
                boxShadow: `0 0 8px ${isBackendUp ? 'var(--accent)' : 'var(--danger)'}`,
              }}
            />
          )}

          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'var(--text-primary)',
            }}
          >
            JARVIS
          </span>

          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: isBackendUp ? 'var(--accent)' : 'var(--danger)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '1px 6px',
              borderRadius: '4px',
              textTransform: 'uppercase',
            }}
          >
            {currentView === 'home' ? state : currentView}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Refresh Backend Health */}
          <button
            onClick={onRefreshHealth}
            disabled={isRefreshing}
            title="Ping local Spring Boot health"
            style={{
              width: '26px',
              height: '26px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} className={isRefreshing ? 'spin-working' : ''} />
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => setCurrentView(currentView === 'settings' ? 'home' : 'settings')}
            title="Assistant settings"
            style={{
              width: '26px',
              height: '26px',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${currentView === 'settings' ? 'var(--accent)' : 'var(--border-subtle)'}`,
              backgroundColor: currentView === 'settings' ? 'var(--accent-muted)' : 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: currentView === 'settings' ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <SettingsIcon size={12} />
          </button>

          {/* Minimize Window */}
          <button
            onClick={handleMinimize}
            title="Minimize"
            style={{
              width: '26px',
              height: '26px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <Minus size={12} />
          </button>

          {/* Collapse to Pill */}
          <button
            onClick={onCollapse}
            title="Collapse to floating pill"
            style={{
              width: '26px',
              height: '26px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <ChevronUp size={13} />
          </button>

          {/* Close Window */}
          <button
            onClick={handleClose}
            title="Close application"
            style={{
              width: '26px',
              height: '26px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* ─── Scrollable Content Area ─── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* ─── VIEW 1: HOME (State B) ─── */}
        {currentView === 'home' && (
          <>
            {/* Context Greeting (Section 4.2 & 5.2) */}
            <div>
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '2px',
                }}
              >
                {getGreeting()}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                What would you like me to take care of?
              </p>
            </div>

            {/* Empty State / Integration Prompt (Section 5.2) */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-card)',
                backgroundColor: 'rgba(66, 214, 197, 0.05)',
                border: '1px solid rgba(66, 214, 197, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={15} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Connect Gmail
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'var(--warning)',
                    backgroundColor: 'var(--warning-muted)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  Action Required
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Connect your Google account to summarize recent emails, detect placement deadlines, and prepare reply drafts.
              </p>
              <button
                onClick={() => setCurrentView('settings')}
                style={{
                  alignSelf: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-chip)',
                  backgroundColor: 'var(--accent)',
                  color: '#0D1117',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '2px',
                }}
              >
                <span>Configure OAuth Credentials</span>
                <ExternalLink size={11} />
              </button>
            </div>

            {/* Local Backend Diagnostics Card (Milestone 0 Verification) */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-card)',
                backgroundColor: 'var(--bg-elevated)',
                border: `1px solid ${isBackendUp ? 'rgba(66, 214, 197, 0.2)' : 'rgba(240, 113, 120, 0.2)'}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Server size={13} style={{ color: isBackendUp ? 'var(--accent)' : 'var(--danger)' }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Local Spring Boot Service
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: isBackendUp ? 'var(--success)' : 'var(--danger)',
                    backgroundColor: isBackendUp ? 'var(--success-muted)' : 'var(--danger-muted)',
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {isBackendUp ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                  {isBackendUp ? `UP • ${backendHealth?.latencyMs || 0}ms` : 'OFFLINE'}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '4px',
                  fontSize: '10px',
                  color: 'var(--text-secondary)',
                }}
              >
                <div>Port: <span style={{ color: 'var(--text-primary)' }}>48765 (127.0.0.1)</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Shield size={10} style={{ color: 'var(--accent)' }} />
                  <span>X-JARVIS-Token</span>
                </div>
              </div>
            </div>

            {/* Quick Action Chips (Section 4.2 & 5.2) */}
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Quick Actions
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={() => setCurrentView('briefing')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-chip)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Mail size={13} style={{ color: 'var(--accent)' }} />
                  <span>Summarize Gmail</span>
                </button>

                <button
                  onClick={() => setCurrentView('draft')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-chip)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <FileText size={13} style={{ color: 'var(--accent)' }} />
                  <span>Draft a Reply</span>
                </button>

                {/* Coming Later Integrations */}
                <button
                  disabled
                  title="Coming in Milestone 2"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-chip)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    cursor: 'not-allowed',
                    textAlign: 'left',
                    opacity: 0.6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={12} />
                    <span>Today's Agenda</span>
                  </div>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase' }}>Later</span>
                </button>

                <button
                  disabled
                  title="Coming in Milestone 3"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-chip)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    cursor: 'not-allowed',
                    textAlign: 'left',
                    opacity: 0.6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FolderOpen size={12} />
                    <span>Find Document</span>
                  </div>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase' }}>Later</span>
                </button>
              </div>
            </div>

            {/* Activity Stream (Section 5.6) */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)',
                  }}
                >
                  Activity Stream
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {activities.length} events
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activities.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}
                  >
                    <div style={{ marginTop: '2px' }}>
                      {item.category === 'gmail' && <Mail size={12} style={{ color: 'var(--accent)' }} />}
                      {item.category === 'security' && <Shield size={12} style={{ color: 'var(--accent)' }} />}
                      {item.category === 'system' && <Clock size={12} style={{ color: 'var(--text-muted)' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {item.title}
                        </span>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                          {item.timestamp}
                        </span>
                      </div>
                      {item.description && (
                        <p
                          style={{
                            fontSize: '10px',
                            color: 'var(--text-secondary)',
                            marginTop: '2px',
                            lineHeight: 1.4,
                          }}
                        >
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── VIEW 2: BRIEFING PREVIEW (State C) ─── */}
        {currentView === 'briefing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Email Briefing
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Scan window: Last 24 hours · 2 need attention
                </span>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  backgroundColor: 'var(--warning-muted)',
                  color: 'var(--warning)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}
              >
                2 Urgent
              </span>
            </div>

            {/* Email 1: Placement / Interview */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-card)',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Google Campus Recruitment
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    backgroundColor: 'rgba(66, 214, 197, 0.15)',
                    color: 'var(--accent)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Recruiter / Interview
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Subject: Final Round Technical Interview Availability
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                "We would like to schedule your 45-minute technical discussion tomorrow at 4:00 PM IST."
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '4px',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontSize: '10px', color: 'var(--warning)' }}>
                  📅 Mentioned: Tomorrow, 4:00 PM
                </span>
                <button
                  onClick={() => setCurrentView('draft')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--accent)',
                    color: '#0D1117',
                    border: 'none',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Draft Reply
                </button>
              </div>
            </div>

            {/* Email 2: College Notice */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-card)',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Dean Academics Office
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    backgroundColor: 'rgba(231, 181, 103, 0.15)',
                    color: 'var(--warning)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Deadline / Notice
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Subject: Submission of Placement Verification Dossier
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                All registered candidates must upload verified marksheets to the student portal before Friday.
              </p>
              <div style={{ marginTop: '2px' }}>
                <span style={{ fontSize: '10px', color: 'var(--warning)' }}>
                  ⏳ Deadline: Friday 5:00 PM
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ─── VIEW 3: REPLY DRAFT REVIEW (State D) ─── */}
        {currentView === 'draft' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Reply Draft Review
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Review and edit before saving to Gmail
                </span>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  backgroundColor: 'var(--warning-muted)',
                  color: 'var(--warning)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}
              >
                Draft · Not sent
              </span>
            </div>

            <div
              style={{
                padding: '10px',
                borderRadius: 'var(--radius-card)',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                To: <span style={{ color: 'var(--text-primary)' }}>university-recruiting@google.com</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Subject: <span style={{ color: 'var(--text-primary)' }}>Re: Final Round Technical Interview</span>
              </div>
              <textarea
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                rows={7}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Never sends autonomously. Saved to Drafts.
                </span>
                <button
                  onClick={() => {
                    setDraftSaved(true);
                    setTimeout(() => setDraftSaved(false), 3000);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-chip)',
                    backgroundColor: draftSaved ? 'var(--success)' : 'var(--accent)',
                    color: '#0D1117',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {draftSaved ? <Check size={12} /> : <Mail size={12} />}
                  <span>{draftSaved ? 'Saved to Gmail Drafts' : 'Save to Gmail Drafts'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── VIEW 4: SETTINGS & CONNECTIONS (State E) ─── */}
        {currentView === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Connections & Settings
            </h3>

            {/* Google OAuth Connection */}
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-card)',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Google Cloud OAuth
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Ready to Link</span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Requires client_id & client_secret from your Google Cloud Console project.
              </p>
              <input
                type="text"
                placeholder="Google Client ID (.apps.googleusercontent.com)"
                style={{
                  height: '30px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  padding: '0 8px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Groq AI Provider */}
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-card)',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Groq AI Provider
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--accent)' }}>llama-3.3-70b</span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showGroqKey ? 'text' : 'password'}
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  placeholder="gsk_••••••••••••••••••••••••"
                  style={{
                    width: '100%',
                    height: '30px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '11px',
                    padding: '0 32px 0 8px',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowGroqKey(!showGroqKey)}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '7px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {showGroqKey ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {/* Local Security & DB */}
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-card)',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontWeight: 600 }}>
                <Shield size={13} style={{ color: 'var(--accent)' }} />
                <span>Local Privacy & Storage</span>
              </div>
              <div>Database: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>SQLite (Local-only)</span></div>
              <div>Backend Port: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>48765 (Loopback)</span></div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Tokens and credentials stored in local Windows credential manager / SQLite. Never leaves your device.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Command Composer (Fixed at bottom per Section 4.2) ─── */}
      <form
        onSubmit={handleSendMessage}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-elevated)',
        }}
      >
        <button
          type="button"
          title="Voice command (coming soon)"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            cursor: 'not-allowed',
          }}
        >
          <Mic size={14} />
        </button>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask JARVIS or type a command..."
          style={{
            flex: 1,
            height: '32px',
            borderRadius: 'var(--radius-chip)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            padding: '0 10px',
            outline: 'none',
          }}
        />

        <button
          type="submit"
          disabled={!inputValue.trim()}
          title="Send"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-chip)',
            border: 'none',
            backgroundColor: inputValue.trim() ? 'var(--accent)' : 'var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: inputValue.trim() ? '#0D1117' : 'var(--text-muted)',
            cursor: inputValue.trim() ? 'pointer' : 'default',
            transition: 'background-color 0.15s ease',
          }}
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
};
