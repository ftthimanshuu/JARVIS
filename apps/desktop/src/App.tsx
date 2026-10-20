import { useState, useEffect } from 'react';
import { FloatingPill } from './components/FloatingPill';
import { ExpandedPanel } from './components/ExpandedPanel';
import { AssistantState, HealthResponse } from './types/jarvis';
import { checkBackendHealth } from './services/api';
import './index.css';

export function App() {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [assistantState, setAssistantState] = useState<AssistantState>('ready');
  const [backendHealth, setBackendHealth] = useState<HealthResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Resize Tauri window dynamically on expand/collapse
  const setWindowSize = async (expanded: boolean) => {
    setIsExpanded(expanded);
    try {
      const { getCurrentWindow, LogicalSize } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      if (expanded) {
        await win.setSize(new LogicalSize(460, 560));
      } else {
        await win.setSize(new LogicalSize(310, 56));
      }
    } catch {
      // Safe fallback when running in browser dev mode
    }
  };

  const handleRefreshHealth = async () => {
    setIsRefreshing(true);
    try {
      const health = await checkBackendHealth();
      setBackendHealth(health);
      if (health.status === 'UP') {
        setAssistantState('ready');
      } else {
        setAssistantState('error');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial health check and periodic polling (every 10 seconds)
  useEffect(() => {
    handleRefreshHealth();
    const interval = setInterval(handleRefreshHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard accessibility: Escape to collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setWindowSize(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  return (
    <div
      style={{
        display: 'inline-block',
        width: isExpanded ? '460px' : '310px',
        height: isExpanded ? '560px' : '56px',
        backgroundColor: 'transparent',
        transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1), height 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {!isExpanded ? (
        <FloatingPill
          state={assistantState}
          backendHealth={backendHealth}
          onExpand={() => setWindowSize(true)}
        />
      ) : (
        <ExpandedPanel
          state={assistantState}
          backendHealth={backendHealth}
          onCollapse={() => setWindowSize(false)}
          onRefreshHealth={handleRefreshHealth}
          isRefreshing={isRefreshing}
        />
      )}
    </div>
  );
}

export default App;
