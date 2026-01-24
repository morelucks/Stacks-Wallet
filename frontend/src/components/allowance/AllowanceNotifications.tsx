import React from 'react';
import { Notification } from '../../types/allowance';

interface AllowanceNotificationsProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onAction: (notificationId: string, actionIndex: number) => void;
}

const AllowanceNotifications: React.FC<AllowanceNotificationsProps> = ({
  notifications,
  onDismiss,
  onAction,
}) => {
  if (notifications.length === 0) {
    return null;
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className="allowance-notifications">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          role="alert"
          aria-live="polite"
        >
          <div className="notification-content">
            <div className="notification-header">
              <span className="notification-icon">
                {getNotificationIcon(notification.type)}
              </span>
              <h4 className="notification-title">{notification.title}</h4>
              {!notification.persistent && (
                <button
                  className="notification-dismiss"
                  onClick={() => onDismiss(notification.id)}
                  aria-label="Dismiss notification"
                >
                  ×
                </button>
              )}
            </div>
            <p className="notification-message">{notification.message}</p>
            <div className="notification-timestamp">
              {notification.timestamp.toLocaleTimeString()}
            </div>
            {notification.actions && notification.actions.length > 0 && (
              <div className="notification-actions">
                {notification.actions.map((action, index) => (
                  <button
                    key={index}
                    className={`notification-action ${action.style || 'secondary'}`}
                    onClick={() => onAction(notification.id, index)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AllowanceNotifications;