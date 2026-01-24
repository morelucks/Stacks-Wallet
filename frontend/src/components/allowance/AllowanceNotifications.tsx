import React, { useEffect, useState } from 'react';
import { Notification } from '../../types/allowance';

interface AllowanceNotificationsProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onAction: (notificationId: string, actionIndex: number) => void;
  maxVisible?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const AllowanceNotifications: React.FC<AllowanceNotificationsProps> = ({
  notifications,
  onDismiss,
  onAction,
  maxVisible = 5,
  position = 'top-right'
}) => {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);
  const [animatingOut, setAnimatingOut] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Show only the most recent notifications
    const recent = notifications.slice(-maxVisible);
    setVisibleNotifications(recent);
  }, [notifications, maxVisible]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      case 'info':
        return '#2196f3';
      default:
        return '#9e9e9e';
    }
  };

  const handleDismiss = (id: string) => {
    setAnimatingOut(prev => new Set([...prev, id]));
    
    // Wait for animation to complete before actually dismissing
    setTimeout(() => {
      onDismiss(id);
      setAnimatingOut(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 300);
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className={`notification-container ${position}`}>
      <div className="notifications-list">
        {visibleNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification notification-${notification.type} ${
              animatingOut.has(notification.id) ? 'animating-out' : 'animating-in'
            }`}
            role="alert"
            aria-live="polite"
            style={{
              borderLeftColor: getNotificationColor(notification.type)
            }}
          >
            <div className="notification-content">
              <div className="notification-header">
                <div className="notification-title-section">
                  <span 
                    className="notification-icon"
                    style={{ color: getNotificationColor(notification.type) }}
                  >
                    {getNotificationIcon(notification.type)}
                  </span>
                  <h4 className="notification-title">{notification.title}</h4>
                </div>
                
                <div className="notification-controls">
                  <span className="notification-time">
                    {formatTimeAgo(notification.timestamp)}
                  </span>
                  {!notification.persistent && (
                    <button
                      className="notification-dismiss"
                      onClick={() => handleDismiss(notification.id)}
                      aria-label="Dismiss notification"
                      title="Dismiss notification"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              
              <p className="notification-message">{notification.message}</p>
              
              {notification.actions && notification.actions.length > 0 && (
                <div className="notification-actions">
                  {notification.actions.map((action, index) => (
                    <button
                      key={index}
                      className={`notification-action ${action.style || 'secondary'}`}
                      onClick={() => onAction(notification.id, index)}
                      title={action.label}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {notification.persistent && (
              <div className="persistent-indicator" title="This notification will not auto-dismiss">
                📌
              </div>
            )}
          </div>
        ))}
      </div>

      {notifications.length > maxVisible && (
        <div className="notifications-overflow">
          <div className="overflow-indicator">
            +{notifications.length - maxVisible} more notifications
          </div>
        </div>
      )}

      <style jsx>{`
        .notification-container {
          position: fixed;
          z-index: 1000;
          max-width: 400px;
          pointer-events: none;
        }

        .notification-container.top-right {
          top: 20px;
          right: 20px;
        }

        .notification-container.top-left {
          top: 20px;
          left: 20px;
        }

        .notification-container.bottom-right {
          bottom: 20px;
          right: 20px;
        }

        .notification-container.bottom-left {
          bottom: 20px;
          left: 20px;
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .notification {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-left: 4px solid;
          padding: 16px;
          pointer-events: auto;
          position: relative;
          transition: all 0.3s ease;
          max-width: 100%;
          word-wrap: break-word;
        }

        .notification.animating-in {
          animation: slideIn 0.3s ease-out;
        }

        .notification.animating-out {
          animation: slideOut 0.3s ease-in;
          opacity: 0;
          transform: translateX(100%);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }

        .notification-content {
          width: 100%;
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .notification-title-section {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .notification-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .notification-title {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          line-height: 1.2;
        }

        .notification-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .notification-time {
          font-size: 12px;
          color: #666;
          white-space: nowrap;
        }

        .notification-dismiss {
          background: none;
          border: none;
          font-size: 18px;
          color: #999;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .notification-dismiss:hover {
          background: #f0f0f0;
          color: #666;
        }

        .notification-message {
          margin: 0;
          font-size: 13px;
          color: #555;
          line-height: 1.4;
        }

        .notification-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          flex-wrap: wrap;
        }

        .notification-action {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .notification-action.primary {
          background: #2196f3;
          color: white;
        }

        .notification-action.primary:hover {
          background: #1976d2;
        }

        .notification-action.secondary {
          background: #f5f5f5;
          color: #333;
        }

        .notification-action.secondary:hover {
          background: #e0e0e0;
        }

        .notification-action.danger {
          background: #f44336;
          color: white;
        }

        .notification-action.danger:hover {
          background: #d32f2f;
        }

        .persistent-indicator {
          position: absolute;
          top: 8px;
          right: 8px;
          font-size: 12px;
          opacity: 0.7;
        }

        .notifications-overflow {
          margin-top: 8px;
          text-align: center;
        }

        .overflow-indicator {
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 12px;
          border-radius: 16px;
          font-size: 12px;
          display: inline-block;
          pointer-events: auto;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .notification {
            background: #2d2d2d;
            color: #e0e0e0;
          }

          .notification-title {
            color: #f0f0f0;
          }

          .notification-message {
            color: #d0d0d0;
          }

          .notification-time {
            color: #a0a0a0;
          }

          .notification-dismiss:hover {
            background: #404040;
            color: #c0c0c0;
          }

          .notification-action.secondary {
            background: #404040;
            color: #e0e0e0;
          }

          .notification-action.secondary:hover {
            background: #505050;
          }
        }

        /* Mobile responsiveness */
        @media (max-width: 480px) {
          .notification-container {
            left: 10px !important;
            right: 10px !important;
            max-width: none;
          }

          .notification {
            padding: 12px;
          }

          .notification-title {
            font-size: 13px;
          }

          .notification-message {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default AllowanceNotifications;