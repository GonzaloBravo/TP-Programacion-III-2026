import React from 'react';
import { Home, School, GraduationCap, CalendarDays, Bell, Calendar, BotMessageSquare } from 'lucide-react';

export type TabId = 'inicio' | 'aulas' | 'plan' | 'agenda' | 'cartelera' | 'calendario' | 'chat';

interface BottomNavProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  unreadCount = 2
}) => {
  const tabs = [
    { id: 'inicio' as TabId, label: 'Inicio', icon: Home },
    { id: 'aulas' as TabId, label: 'Aulas Hoy', icon: School },
    { id: 'plan' as TabId, label: 'Plan', icon: GraduationCap },
    { id: 'agenda' as TabId, label: 'Agenda', icon: CalendarDays },
    { id: 'cartelera' as TabId, label: 'Cartelera', icon: Bell, badge: unreadCount },
    { id: 'calendario' as TabId, label: 'Fechas', icon: Calendar },
    { id: 'chat' as TabId, label: 'Chat IA', icon: BotMessageSquare, isAi: true }
  ];

  return (
    <nav className="bottom-nav-container">
      <div className="bottom-nav">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              className={`nav-item ${isActive ? 'active' : ''} ${tab.isAi ? 'ai-item' : ''}`}
              onClick={() => onSelectTab(tab.id)}
              aria-label={tab.label}
            >
              <div className="icon-wrapper">
                <Icon size={20} className="nav-icon" />
                {Boolean(tab.badge && tab.badge > 0 && !isActive) && (
                  <span className="nav-badge">{tab.badge}</span>
                )}
                {tab.isAi && <span className="ai-sparkle-dot" />}
              </div>
              <span className="nav-label">{tab.label}</span>
              {isActive && <span className="active-indicator" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
