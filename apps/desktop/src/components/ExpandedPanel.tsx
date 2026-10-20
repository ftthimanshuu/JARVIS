import { FC, useState, useEffect, MouseEvent } from 'react';
import {
  ChevronUp,
  RefreshCw,
  Shield,
  Mail,
  Clock,
  ArrowUp,
  Mic,
  Settings as SettingsIcon,
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
  Sun,
  Moon,
  Loader2,
} from 'lucide-react';
import { AssistantState, HealthResponse, ActivityItem, GoogleAuthStatus, EmailSummary, AiConfig, EmailAiSummary } from '../types/jarvis';
import {
  getGoogleAuthStatus,
  getGoogleAuthUrl,
  disconnectGoogle,
  getRecentEmails,
  createGmailDraft,
  getAiConfig,
  saveAiConfig,
  summarizeEmail,
  generateAiDraft,
  sendChatPrompt,
} from '../services/api';

type PanelView = 'home' | 'briefing' | 'draft' | 'calendar_preview' | 'drive_preview' | 'settings';

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
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [inputValue, setInputValue] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [showGroqKey, setShowGroqKey] = useState(false);

  // Google OAuth & Gmail state
  const [googleStatus, setGoogleStatus] = useState<GoogleAuthStatus>({ connected: false, configured: false });
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isFetchingEmails, setIsFetchingEmails] = useState(false);
  const [realEmails, setRealEmails] = useState<EmailSummary[]>([]);
  const [draftTo, setDraftTo] = useState('recruiter@example.com');
  const [draftSubject, setDraftSubject] = useState('Re: Technical interview invitation');
  const [draftThreadId, setDraftThreadId] = useState<string | undefined>(undefined);
  const [draftBody, setDraftBody] = useState(
    "Dear Hiring Team,\n\nThank you for reaching out regarding the technical interview. I can confirm that 22 Oct at 3:00 PM works well for me. Please let me know if there are any specific topics or materials I should prepare in advance.\n\nBest regards,\nHimanshu"
  );
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);

  // Groq AI state
  const [aiConfig, setAiConfig] = useState<AiConfig>({ configured: false, model: 'openai/gpt-oss-120b' });
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keySavedMessage, setKeySavedMessage] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, EmailAiSummary>>({});
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: 'act-1',
      title: 'Daily summary ready',
      timestamp: '10m ago',
      status: 'success',
      category: 'gmail',
      description: '8 emails reviewed · 2 need attention',
    },
    {
      id: 'act-2',
      title: 'Local Spring Boot service active',
      timestamp: '1m ago',
      status: backendHealth?.status === 'UP' ? 'success' : 'pending',
      category: 'system',
      description: `Binding on 127.0.0.1:48765 (${backendHealth?.latencyMs || 0}ms)`,
    },
    {
      id: 'act-3',
      title: 'Per-session token protected',
      timestamp: '2m ago',
      status: 'success',
      category: 'security',
      description: 'X-JARVIS-Token verified on loopback interface',
    },
  ]);

  const isBackendUp = backendHealth?.status === 'UP';

  const openExternalUrl = async (url: string) => {
    try {
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(url);
    } catch {
      window.open(url, '_blank');
    }
  };

  const loadGoogleStatus = async () => {
    try {
      const status = await getGoogleAuthStatus();
      setGoogleStatus(status);
      if (status.connected) {
        loadEmails();
      }
    } catch (e) {
      console.error('Failed to get Google status:', e);
    }
  };

  const loadEmails = async () => {
    setIsFetchingEmails(true);
    try {
      const emails = await getRecentEmails(10);
      setRealEmails(emails);
    } catch (e) {
      console.error('Failed to load emails:', e);
    } finally {
      setIsFetchingEmails(false);
    }
  };

  const loadAiConfig = async () => {
    try {
      const config = await getAiConfig();
      setAiConfig(config);
      if (config.maskedApiKey) {
        setGroqApiKey(config.maskedApiKey);
      }
    } catch (e) {
      console.error('Failed to load AI config:', e);
    }
  };

  useEffect(() => {
    loadGoogleStatus();
    loadAiConfig();
  }, []);

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      const authUrl = await getGoogleAuthUrl();
      await openExternalUrl(authUrl);

      // Poll for 60 seconds to detect when user finishes OAuth in browser
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const status = await getGoogleAuthStatus();
          if (status.connected) {
            setGoogleStatus(status);
            setIsConnectingGoogle(false);
            clearInterval(interval);
            loadEmails();
            setActivities((prev) => [
              {
                id: `act-${Date.now()}`,
                title: 'Gmail connected successfully',
                timestamp: 'Just now',
                status: 'success',
                category: 'gmail',
                description: `Linked account: ${status.email}`,
              },
              ...prev,
            ]);
          }
        } catch {}

        if (attempts >= 30) {
          clearInterval(interval);
          setIsConnectingGoogle(false);
        }
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to start Google OAuth flow');
      setIsConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await disconnectGoogle();
      setGoogleStatus({ connected: false, configured: true });
      setRealEmails([]);
      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          title: 'Google account disconnected',
          timestamp: 'Just now',
          status: 'pending',
          category: 'gmail',
          description: 'Gmail access revoked',
        },
        ...prev,
      ]);
    } catch (err: any) {
      alert(err.message || 'Failed to disconnect Google account');
    }
  };

  const handleSaveGroqKey = async () => {
    if (!groqApiKey.trim() || groqApiKey.includes('••••')) return;
    setIsSavingKey(true);
    setKeySavedMessage(null);
    try {
      await saveAiConfig(groqApiKey.trim(), aiConfig.model);
      const updated = await getAiConfig();
      setAiConfig(updated);
      setKeySavedMessage('API Key saved securely');
      setTimeout(() => setKeySavedMessage(null), 3000);
      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          title: 'Groq AI configured',
          timestamp: 'Just now',
          status: 'success',
          category: 'system',
          description: `Active model: ${updated.model}`,
        },
        ...prev,
      ]);
    } catch (err: any) {
      alert(err.message || 'Failed to save Groq API key');
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleSummarizeEmail = async (email: EmailSummary) => {
    setSummarizingId(email.id);
    try {
      const summary = await summarizeEmail(email.from, email.subject, email.snippet);
      setSummaries((prev) => ({ ...prev, [email.id]: summary }));
    } catch (err: any) {
      alert(err.message || 'Failed to summarize email with Groq');
    } finally {
      setSummarizingId(null);
    }
  };

  const handleSelectEmailForDraft = async (email: EmailSummary) => {
    setDraftTo(email.from);
    setDraftSubject(`Re: ${email.subject.replace(/^Re:\s*/i, '')}`);
    setDraftThreadId(email.threadId);
    setDraftNotice(null);
    setCurrentView('draft');

    if (aiConfig.configured) {
      setIsGeneratingDraft(true);
      setDraftBody(`Generating AI draft with ${aiConfig.model || 'Groq AI'}…`);
      try {
        const aiDraft = await generateAiDraft(email.from, email.subject, email.snippet);
        setDraftBody(aiDraft);
      } catch (e) {
        console.error('Failed to generate AI draft:', e);
        setDraftBody(
          `Hi,\n\nThank you for reaching out regarding "${email.subject}".\n\nI have received your message and will review the details shortly.\n\nBest regards,\nHimanshu`
        );
      } finally {
        setIsGeneratingDraft(false);
      }
    } else {
      setDraftBody(
        `Hi,\n\nThank you for reaching out regarding "${email.subject}".\n\nI have received your message and will review the details shortly.\n\nBest regards,\nHimanshu`
      );
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setDraftNotice(null);
    try {
      const result = await createGmailDraft(draftTo, draftSubject, draftBody, draftThreadId);
      setDraftSaved(true);
      setDraftNotice(`Saved to Gmail Drafts (ID: ${result.draftId.substring(0, 8)}…) · Not sent`);
      setTimeout(() => setDraftSaved(false), 5000);
      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          title: 'Gmail draft created',
          timestamp: 'Just now',
          status: 'success',
          category: 'gmail',
          description: `Draft to ${draftTo} saved in Gmail`,
        },
        ...prev,
      ]);
    } catch (err: any) {
      alert(err.message || 'Failed to save draft to Gmail');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const lower = inputValue.toLowerCase();
    if (lower.includes('email') || lower.includes('brief') || lower.includes('mail') || lower.includes('summary')) {
      setCurrentView('briefing');
    } else if (lower.includes('draft') || lower.includes('reply')) {
      setCurrentView('draft');
    } else if (lower.includes('setting') || lower.includes('key')) {
      setCurrentView('settings');
    } else if (lower.includes('calendar') || lower.includes('agenda')) {
      setCurrentView('calendar_preview');
    } else if (lower.includes('drive') || lower.includes('file') || lower.includes('doc')) {
      setCurrentView('drive_preview');
    }

    const promptText = inputValue.trim();
    setInputValue('');

    const userActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      title: `Prompt: "${promptText}"`,
      timestamp: 'Just now',
      status: isBackendUp ? 'success' : 'failed',
      category: 'system',
      description: isBackendUp ? 'Processing query…' : 'Backend offline at 127.0.0.1:48765.',
    };

    setActivities((prev) => [userActivity, ...prev]);

    if (aiConfig.configured && isBackendUp) {
      setChatLoading(true);
      sendChatPrompt(promptText)
        .then((reply) => {
          setActivities((prev) => [
            {
              id: `act-${Date.now()}`,
              title: 'JARVIS AI',
              timestamp: 'Just now',
              status: 'success',
              category: 'system',
              description: reply,
            },
            ...prev,
          ]);
        })
        .catch((err) => {
          console.error('Chat error:', err);
        })
        .finally(() => {
          setChatLoading(false);
        });
    }
  };

  return (
    <div
      className="expanded-panel-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '460px',
        height: '560px',
        borderRadius: 'var(--radius-panel)',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'none',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* ─── Header (Figma: y ≈ 62px divider) ─── */}
      <div
        data-tauri-drag-region
        onMouseDown={handleStartDrag}
        onPointerDown={handleStartDrag}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          cursor: 'grab',
        }}
      >
        <div
          data-tauri-drag-region
          onMouseDown={handleStartDrag}
          onPointerDown={handleStartDrag}
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          {currentView !== 'home' ? (
            <button
              onClick={() => setCurrentView('home')}
              title="Back to home"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
              }}
            >
              <ArrowLeft size={16} />
            </button>
          ) : (
            /* Hollow Mini Ring */
            <div
              style={{
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
          )}

          {/* Wordmark: JARVIS 15px Semi Bold */}
          <span
            style={{
              fontSize: '15px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: 'var(--color-text-primary)',
            }}
          >
            JARVIS
          </span>

          {/* Connection status indicator: 8x8 dot + label (Figma: Section 6.1) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '6px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isBackendUp ? 'var(--color-accent)' : 'var(--color-danger)',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                color: 'var(--color-text-muted)',
              }}
            >
              {isBackendUp ? `127.0.0.1:48765 · ${state}` : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Window & View Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Theme Switcher (Dark / Light) */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-raised)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
          </button>

          {/* Refresh Health */}
          <button
            onClick={onRefreshHealth}
            disabled={isRefreshing}
            title="Ping backend health"
            style={{
              width: '26px',
              height: '26px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-raised)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} className={isRefreshing ? 'spin-working' : ''} />
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => setCurrentView(currentView === 'settings' ? 'home' : 'settings')}
            title="Settings & Connections"
            style={{
              width: '26px',
              height: '26px',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${currentView === 'settings' ? 'var(--color-accent)' : 'var(--color-border)'}`,
              backgroundColor: currentView === 'settings' ? 'var(--color-accent-soft)' : 'var(--color-surface-raised)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: currentView === 'settings' ? 'var(--color-accent)' : 'var(--color-text-muted)',
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
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-raised)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
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
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-raised)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            <ChevronUp size={13} />
          </button>

          {/* Close Window */}
          <button
            onClick={handleClose}
            title="Close"
            style={{
              width: '26px',
              height: '26px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-raised)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-danger)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
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
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {/* ─── VIEW 1: ASSISTANT HOME (Screen • Assistant Home • Dark / Light) ─── */}
        {currentView === 'home' && (
          <>
            {/* Greeting: "How can I help?" 23px Semi Bold (Section 6.2) */}
            <div>
              <h1
                style={{
                  fontSize: '23px',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '4px',
                  lineHeight: 1.25,
                }}
              >
                How can I help?
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Your workspace, summarized.
              </p>
            </div>

            {/* Quick-action chips (Figma: height 34px, radius 17px, raised surface, 10x10 accent dot) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                onClick={() => setCurrentView('briefing')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '34px',
                  padding: '0 14px',
                  borderRadius: 'var(--radius-chip)',
                  backgroundColor: 'var(--color-surface-raised)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-accent)',
                  }}
                />
                <span>Summarize emails</span>
              </button>

              <button
                onClick={() => setCurrentView('draft')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '34px',
                  padding: '0 14px',
                  borderRadius: 'var(--radius-chip)',
                  backgroundColor: 'var(--color-surface-raised)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-accent)',
                  }}
                />
                <span>Draft a reply</span>
              </button>

              <button
                onClick={() => setCurrentView('calendar_preview')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '34px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-chip)',
                  backgroundColor: 'var(--color-surface-raised)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  opacity: 0.85,
                }}
              >
                <Calendar size={12} />
                <span>Today's agenda</span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    textTransform: 'uppercase',
                  }}
                >
                  Preview
                </span>
              </button>

              <button
                onClick={() => setCurrentView('drive_preview')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '34px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-chip)',
                  backgroundColor: 'var(--color-surface-raised)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  opacity: 0.85,
                }}
              >
                <FolderOpen size={12} />
                <span>Search Drive</span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    textTransform: 'uppercase',
                  }}
                >
                  Preview
                </span>
              </button>
            </div>

            {/* Connect Gmail First-Launch Card (Section 5.2 & 6.5) */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-card)',
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={15} style={{ color: 'var(--color-accent)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Connect Gmail
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'var(--color-warning)',
                    backgroundColor: 'var(--warning-muted)',
                    padding: '2px 7px',
                    borderRadius: '4px',
                  }}
                >
                  Action Required
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
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
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-accent)',
                  color: '#0D1117',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '2px',
                }}
              >
                <span>Setup OAuth Credentials</span>
                <ExternalLink size={11} />
              </button>
            </div>

            {/* Recent Activity (Figma: Section 6.3 - RECENT ACTIVITY, 34x34 tile) */}
            <div style={{ flex: 1 }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--color-accent)',
                  display: 'block',
                  marginBottom: '10px',
                }}
              >
                Recent Activity
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activities.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-card)',
                      backgroundColor: 'var(--color-surface-raised)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {/* Activity Icon Tile: 34x34 with 9px radius and soft accent background */}
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '9px',
                        backgroundColor: 'var(--color-accent-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-accent)',
                        flexShrink: 0,
                      }}
                    >
                      {item.category === 'gmail' && <Mail size={16} />}
                      {item.category === 'security' && <Shield size={16} />}
                      {item.category === 'system' && <Clock size={16} />}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {item.title}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                          {item.timestamp}
                        </span>
                      </div>
                      {item.description && (
                        <p
                          style={{
                            fontSize: '11px',
                            color: 'var(--color-text-muted)',
                            marginTop: '2px',
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

        {/* ─── VIEW 2: EMAIL BRIEFING (Screen • Email Briefing • Dark, Section 7) ─── */}
        {currentView === 'briefing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Header: Email briefing 17px Semi Bold, Attention badge 153x29px */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h2
                  style={{
                    fontSize: '17px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: '2px',
                  }}
                >
                  Email briefing
                </h2>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  {googleStatus.connected
                    ? `Live Sync · ${googleStatus.email}`
                    : 'Today · Last 24 hours'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {googleStatus.connected && (
                  <button
                    onClick={loadEmails}
                    disabled={isFetchingEmails}
                    title="Refresh Gmail"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-surface-raised)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <RefreshCw
                      size={13}
                      style={{
                        animation: isFetchingEmails ? 'spin 1s linear infinite' : 'none',
                      }}
                    />
                  </button>
                )}

                {/* Attention Badge: radius 15px, background #173B3A, accent text */}
                <div
                  style={{
                    height: '29px',
                    padding: '0 12px',
                    borderRadius: '15px',
                    backgroundColor: 'var(--color-accent-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--color-accent)',
                    }}
                  >
                    {googleStatus.connected
                      ? `${realEmails.filter((e) => e.unread || e.urgency === 'high').length} need attention`
                      : 'Connect Gmail'}
                  </span>
                </div>
              </div>
            </div>

            {/* Google OAuth Not Connected Banner */}
            {!googleStatus.connected && (
              <div
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-card)',
                  backgroundColor: 'var(--color-accent-soft)',
                  border: '1px solid rgba(100, 255, 218, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Gmail Not Linked
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Connect your Google account to read your real inbox and generate drafts.
                  </div>
                </div>
                <button
                  onClick={handleConnectGoogle}
                  disabled={isConnectingGoogle}
                  style={{
                    height: '30px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-accent)',
                    border: 'none',
                    color: '#0D1117',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {isConnectingGoogle ? (
                    <>
                      <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Linking…</span>
                    </>
                  ) : (
                    <>
                      <Mail size={13} />
                      <span>Connect Gmail</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--color-accent)',
                marginTop: '4px',
              }}
            >
              {googleStatus.connected ? 'Recent Messages' : 'Priority Preview (Demo)'}
            </span>

            {/* Live Emails Rendering */}
            {googleStatus.connected && realEmails.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {realEmails.map((email) => (
                  <div
                    key={email.id}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-card)',
                      backgroundColor: 'var(--color-surface-raised)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: email.urgency === 'high' ? 'var(--color-warning)' : 'var(--color-accent)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {email.urgency === 'high' ? 'Priority · Action Required' : (email.unread ? 'Unread Message' : 'Read')}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                        {new Date(email.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
                        {email.from}
                      </h4>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {email.subject}
                      </div>
                    </div>

                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
                      {email.snippet}
                    </p>

                    {/* AI Summarization Box */}
                    {summaries[email.id] && (
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--color-bg-base)',
                          border: '1px solid rgba(100, 255, 218, 0.25)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              color: 'var(--color-accent)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Sparkles size={11} />
                            <span>AI Intelligence Brief</span>
                          </span>
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 600,
                              color: summaries[email.id].urgency === 'HIGH' ? 'var(--color-warning)' : 'var(--color-accent)',
                            }}
                          >
                            {summaries[email.id].urgency} PRIORITY
                          </span>
                        </div>

                        <div style={{ fontSize: '11px', color: 'var(--color-text-primary)', lineHeight: 1.45 }}>
                          {summaries[email.id].summary}
                        </div>

                        {summaries[email.id].keyDates && summaries[email.id].keyDates.length > 0 && (
                          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                            Dates: <span style={{ color: 'var(--color-accent)', fontWeight: 500 }}>{summaries[email.id].keyDates.join(', ')}</span>
                          </div>
                        )}

                        {summaries[email.id].actionRequired && (
                          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                            Next step: <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{summaries[email.id].actionRequired}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--color-border)',
                      }}
                    >
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                        {email.suggestedAction || 'Review message'}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {aiConfig.configured && (
                          <button
                            onClick={() => handleSummarizeEmail(email)}
                            disabled={summarizingId === email.id}
                            style={{
                              height: '26px',
                              padding: '0 8px',
                              borderRadius: '7px',
                              backgroundColor: 'var(--color-surface)',
                              border: '1px solid var(--color-border)',
                              color: 'var(--color-accent)',
                              fontSize: '11px',
                              fontWeight: 500,
                              cursor: summarizingId === email.id ? 'wait' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {summarizingId === email.id ? (
                              <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <Sparkles size={11} />
                            )}
                            <span>AI Brief</span>
                          </button>
                        )}
                        <button
                          onClick={() => openExternalUrl(`https://mail.google.com/mail/u/0/#inbox/${email.id}`)}
                          style={{
                            height: '26px',
                            padding: '0 10px',
                            borderRadius: '7px',
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-primary)',
                            fontSize: '11px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <ExternalLink size={11} />
                          <span>Gmail</span>
                        </button>
                        <button
                          onClick={() => handleSelectEmailForDraft(email)}
                          style={{
                            height: '26px',
                            padding: '0 10px',
                            borderRadius: '7px',
                            backgroundColor: 'var(--color-accent)',
                            border: 'none',
                            color: '#0D1117',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Draft reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* If connected and 0 emails */}
            {googleStatus.connected && realEmails.length === 0 && !isFetchingEmails && (
              <div
                style={{
                  padding: '24px',
                  borderRadius: 'var(--radius-card)',
                  backgroundColor: 'var(--color-surface-raised)',
                  border: '1px solid var(--color-border)',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  fontSize: '12px',
                }}
              >
                Inbox is all caught up! No unread messages found.
              </div>
            )}

            {/* Fallback Sample Cards when not connected */}
            {!googleStatus.connected && (
              <>
                {/* Email Card 1 (Hiring Team / Recruiter): Section 7.2 */}
                <div
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-card)',
                    backgroundColor: 'var(--color-surface-raised)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'var(--color-warning)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Recruiter · Reply Needed
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                      10:15 AM
                    </span>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
                      Hiring Team
                    </h4>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      Technical interview availability
                    </div>
                  </div>

                  <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
                    The sender requests confirmation of your availability for the final technical assessment.
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--color-border)',
                    }}
                  >
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                      Date mentioned: 22 Oct · verify in source
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => setCurrentView('draft')}
                        style={{
                          height: '26px',
                          padding: '0 10px',
                          borderRadius: '7px',
                          backgroundColor: 'var(--color-accent)',
                          border: 'none',
                          color: '#0D1117',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Draft reply
                      </button>
                    </div>
                  </div>
                </div>

                {/* Email Card 2 (College Administration): Section 7.2 */}
                <div
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-card)',
                    backgroundColor: 'var(--color-surface-raised)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'var(--color-warning)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      College Notice · Action Required
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                      Yesterday
                    </span>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
                      College Administration
                    </h4>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      Internal assessment timetable
                    </div>
                  </div>

                  <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
                    An updated timetable has been shared for the semester assessments. Please verify hall allocations.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── VIEW 3: REPLY DRAFT REVIEW (Screen • Draft Reply • Dark, Section 8) ─── */}
        {currentView === 'draft' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Draft reply
              </h2>

              {/* Badge: Draft · Not sent (Figma: #30251A background, #E7B567 text) */}
              <div
                style={{
                  height: '28px',
                  padding: '0 12px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--color-warning-soft)',
                  border: '1px solid rgba(231, 181, 103, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--color-warning)',
                  }}
                >
                  Draft · Not sent
                </span>
              </div>
            </div>

            {/* Recipient & Subject Fields (Section 8.1) */}
            {isGeneratingDraft && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-accent-soft)',
                  border: '1px solid rgba(100, 255, 218, 0.3)',
                  fontSize: '11px',
                  color: 'var(--color-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                <span>LLaMA 3.3 is composing an intelligent reply draft…</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-surface-raised)',
                  border: '1px solid var(--color-border)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', width: '45px' }}>To:</span>
                <input
                  type="text"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                    fontWeight: 500,
                    outline: 'none',
                  }}
                />
              </div>

              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-surface-raised)',
                  border: '1px solid var(--color-border)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', width: '45px' }}>Subject:</span>
                <input
                  type="text"
                  value={draftSubject}
                  onChange={(e) => setDraftSubject(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                    fontWeight: 500,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Draft Body Editor (Section 8.1: #0D1117 background, 9px radius) */}
            <textarea
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              rows={8}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '9px',
                backgroundColor: 'var(--color-bg-base)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                lineHeight: 1.55,
                outline: 'none',
                resize: 'none',
              }}
            />

            {draftNotice && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-accent-soft)',
                  border: '1px solid rgba(100, 255, 218, 0.3)',
                  fontSize: '11px',
                  color: 'var(--color-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{draftNotice}</span>
                <button
                  onClick={() => openExternalUrl('https://mail.google.com/mail/u/0/#drafts')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-primary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  View in Gmail
                </button>
              </div>
            )}

            {/* Action Buttons (Section 8.2) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setCurrentView('briefing')}
                  style={{
                    height: '32px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-surface-raised)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Back to inbox
                </button>
              </div>

              {/* Primary Action: Save to Gmail Drafts */}
              <button
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: '32px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  backgroundColor: draftSaved ? 'var(--color-success)' : 'var(--color-accent)',
                  color: '#0D1117',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isSavingDraft ? 'wait' : 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
              >
                {isSavingDraft ? (
                  <>
                    <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Saving to Gmail…</span>
                  </>
                ) : draftSaved ? (
                  <>
                    <Check size={13} />
                    <span>Saved to Drafts</span>
                  </>
                ) : (
                  <>
                    <Mail size={13} />
                    <span>Save to Gmail Drafts</span>
                  </>
                )}
              </button>
            </div>

            <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
              * Rule: JARVIS will never send email autonomously. Saved drafts must be manually sent from your Gmail account.
            </p>
          </div>
        )}

        {/* ─── VIEW 4: CALENDAR PREVIEW (Preview • Calendar • Light/Dark, Section 9.2) ─── */}
        {currentView === 'calendar_preview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
                Today's agenda
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Times shown in local time · Coming in Milestone 2
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { time: '10:00 AM', title: 'Sprint Retrospective & Demo', tag: 'Team' },
                { time: '02:00 PM', title: 'Code Review: Tauri IPC Bridge', tag: 'Dev' },
                { time: '04:00 PM', title: 'Technical Interview (Google Recruitment)', tag: 'Important' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-card)',
                    backgroundColor: 'var(--color-surface-raised)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div
                    style={{
                      width: '3px',
                      height: '24px',
                      borderRadius: '2px',
                      backgroundColor: idx === 2 ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {item.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── VIEW 5: DRIVE PREVIEW (Preview • Drive Search • Dark, Section 9.3) ─── */}
        {currentView === 'drive_preview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
                Search Drive
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Drive Search & Document Summary · Coming in Milestone 3
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { file: 'Himanshu_Resume_2026.pdf', size: '245 KB', date: 'Modified 2 days ago' },
                { file: 'Placement_Prep_System_Design.docx', size: '1.2 MB', date: 'Modified yesterday' },
                { file: 'JARVIS_Spring_Boot_Notes.pdf', size: '890 KB', date: 'Modified 4 hours ago' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-card)',
                    backgroundColor: 'var(--color-surface-raised)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <FolderOpen size={16} style={{ color: 'var(--color-accent)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {item.file}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                      {item.size} · {item.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── VIEW 6: SETTINGS (State E, Section 5.5) ─── */}
        {currentView === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Connections & Settings
            </h2>

            {/* Google OAuth Connection */}
            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-card)',
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={15} style={{ color: 'var(--color-accent)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Google Cloud OAuth 2.0
                  </span>
                </div>
                {googleStatus.connected ? (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: 'var(--color-success)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
                    Connected
                  </span>
                ) : (
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                    {googleStatus.configured ? 'credentials.json Active' : 'Not configured'}
                  </span>
                )}
              </div>

              <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
                {googleStatus.connected
                  ? `Authenticated as ${googleStatus.email}. Securely stored in local SQLite database.`
                  : 'Link your Gmail account to enable live email briefings and draft generation.'}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                {googleStatus.connected ? (
                  <>
                    <button
                      onClick={handleDisconnectGoogle}
                      style={{
                        height: '30px',
                        padding: '0 12px',
                        borderRadius: '7px',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-danger, #ef4444)',
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Disconnect
                    </button>
                    <button
                      onClick={() => {
                        loadEmails();
                        setCurrentView('briefing');
                      }}
                      style={{
                        height: '30px',
                        padding: '0 12px',
                        borderRadius: '7px',
                        backgroundColor: 'var(--color-accent)',
                        border: 'none',
                        color: '#0D1117',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Open Email Briefing
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConnectGoogle}
                    disabled={isConnectingGoogle}
                    style={{
                      height: '32px',
                      padding: '0 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-accent)',
                      border: 'none',
                      color: '#0D1117',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {isConnectingGoogle ? (
                      <>
                        <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Authorizing in Browser…</span>
                      </>
                    ) : (
                      <>
                        <Mail size={13} />
                        <span>Connect Gmail Account</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Groq AI Provider */}
            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-card)',
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={15} style={{ color: 'var(--color-accent)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Groq AI Provider
                  </span>
                </div>
                {aiConfig.configured ? (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: 'var(--color-success)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
                    Active ({aiConfig.model})
                  </span>
                ) : (
                  <span style={{ fontSize: '10px', color: 'var(--color-accent)' }}>openai/gpt-oss-120b</span>
                )}
              </div>

              <p style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Provides ultra-fast Groq AI inference for email summarization, draft generation, and smart chat.
              </p>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type={showGroqKey ? 'text' : 'password'}
                    value={groqApiKey}
                    onChange={(e) => setGroqApiKey(e.target.value)}
                    placeholder="gsk_••••••••••••••••••••••••"
                    style={{
                      width: '100%',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '11px',
                      padding: '0 32px 0 10px',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowGroqKey(!showGroqKey)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {showGroqKey ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>

                <button
                  onClick={handleSaveGroqKey}
                  disabled={isSavingKey || !groqApiKey.trim() || groqApiKey.includes('••••')}
                  style={{
                    height: '32px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-accent)',
                    border: 'none',
                    color: '#0D1117',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: (isSavingKey || !groqApiKey.trim() || groqApiKey.includes('••••')) ? 'not-allowed' : 'pointer',
                    opacity: (!groqApiKey.trim() || groqApiKey.includes('••••')) ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isSavingKey ? (
                    <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Check size={12} />
                  )}
                  <span>Save Key</span>
                </button>
              </div>

              {keySavedMessage && (
                <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 500 }}>
                  ✓ {keySavedMessage}
                </span>
              )}
            </div>

            {/* Local Security & DB */}
            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-card)',
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                <Shield size={13} style={{ color: 'var(--color-accent)' }} />
                <span>Local Privacy & Storage</span>
              </div>
              <div>Database: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>SQLite (Local-only)</span></div>
              <div>Backend Port: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>48765 (Loopback)</span></div>
              <span style={{ fontSize: '10px' }}>
                Tokens and credentials stored in local Windows credential store / SQLite. Never leaves your machine.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Fixed Command Composer (Figma: Section 6.4 - 54px height, 13px radius) ─── */}
      <form
        onSubmit={handleSendMessage}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 18px',
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <button
          type="button"
          title="Voice command (coming soon)"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-muted)',
            cursor: 'not-allowed',
          }}
        >
          <Mic size={15} />
        </button>

        {/* Input box: 13px radius, surface raised (Section 6.4) */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={chatLoading ? 'JARVIS is thinking…' : (aiConfig.configured ? 'Ask JARVIS anything…' : 'Ask JARVIS (Set Groq key in Settings for AI)…')}
          disabled={chatLoading}
          style={{
            flex: 1,
            height: '38px',
            borderRadius: '13px',
            backgroundColor: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            fontSize: '13px',
            padding: '0 14px',
            outline: 'none',
            opacity: chatLoading ? 0.7 : 1,
          }}
        />

        {/* Send Button: 34x34 with 10px radius, accent fill, crisp upward arrow */}
        <button
          type="submit"
          disabled={!inputValue.trim() || chatLoading}
          title="Send"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: inputValue.trim() && !chatLoading ? 'var(--color-accent)' : 'var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: inputValue.trim() && !chatLoading ? '#0D1117' : 'var(--color-text-muted)',
            cursor: inputValue.trim() && !chatLoading ? 'pointer' : 'default',
            transition: 'background-color 0.15s ease',
          }}
        >
          {chatLoading ? (
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <ArrowUp size={16} strokeWidth={2.5} />
          )}
        </button>
      </form>
    </div>
  );
};
