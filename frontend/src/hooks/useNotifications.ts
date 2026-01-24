import { useState, useCallback, useRef, useEffect } from 'react';
import { Notification, NotificationAction } from '../types/allowance';

interface NotificationOptions {
  persistent?: boolean;
  duration?: number;
  actions?: NotificationAction[];
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      timeouts.current.forEach(timeout => clearTimeout(timeout));
      timeouts.current.clear();
    };
  }, []);

  const generateId = useCallback(() => {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addNotification = useCallback((
    type: Notification['type'],
    title: string,
    message: string,
    options: NotificationOptions = {}
  ): string => {
    const id = generateId();
    const notification: Notification = {
      id,
      type,
      title,
      message,
      timestamp: new Date(),
      persistent: options.persistent || false,
      actions: options.actions
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-dismiss non-persistent notifications
    if (!notification.persistent) {
      const duration = options.duration || getDefaultDuration(type);
      const timeout = setTimeout(() => {
        dismissNotification(id);
      }, duration);
      
      timeouts.current.set(id, timeout);
    }

    return id;
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    const timeout = timeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeouts.current.delete(id);
    }
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications([]);
    timeouts.current.forEach(timeout => clearTimeout(timeout));
    timeouts.current.clear();
  }, []);

  const executeAction = useCallback((notificationId: string, actionIndex: number) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && notification.actions && notification.actions[actionIndex]) {
      const action = notification.actions[actionIndex];
      action.action();
      
      // Dismiss notification after action execution unless it's persistent
      if (!notification.persistent) {
        dismissNotification(notificationId);
      }
    }
  }, [notifications, dismissNotification]);

  // Convenience methods for different notification types
  const success = useCallback((title: string, message: string, options?: NotificationOptions) => {
    return addNotification('success', title, message, options);
  }, [addNotification]);

  const error = useCallback((title: string, message: string, options?: NotificationOptions) => {
    return addNotification('error', title, message, { 
      persistent: true, 
      ...options 
    });
  }, [addNotification]);

  const warning = useCallback((title: string, message: string, options?: NotificationOptions) => {
    return addNotification('warning', title, message, options);
  }, [addNotification]);

  const info = useCallback((title: string, message: string, options?: NotificationOptions) => {
    return addNotification('info', title, message, options);
  }, [addNotification]);

  // Transaction-specific notifications
  const transactionStarted = useCallback((transactionType: string, details?: string) => {
    return info(
      'Transaction Started',
      `${transactionType} transaction has been initiated${details ? `: ${details}` : ''}`,
      { duration: 3000 }
    );
  }, [info]);

  const transactionCompleted = useCallback((
    transactionType: string, 
    transactionHash?: string,
    details?: string
  ) => {
    const actions: NotificationAction[] = [];
    
    if (transactionHash) {
      actions.push({
        label: 'View Transaction',
        action: () => {
          // Open transaction in explorer
          const explorerUrl = `https://explorer.stacks.co/txid/${transactionHash}`;
          window.open(explorerUrl, '_blank');
        },
        style: 'primary'
      });
    }

    return success(
      'Transaction Completed',
      `${transactionType} transaction completed successfully${details ? `: ${details}` : ''}`,
      { 
        duration: 8000,
        actions
      }
    );
  }, [success]);

  const transactionFailed = useCallback((
    transactionType: string, 
    errorMessage: string,
    retryAction?: () => void
  ) => {
    const actions: NotificationAction[] = [];
    
    if (retryAction) {
      actions.push({
        label: 'Retry',
        action: retryAction,
        style: 'primary'
      });
    }

    return error(
      'Transaction Failed',
      `${transactionType} transaction failed: ${errorMessage}`,
      { actions }
    );
  }, [error]);

  // Bulk operation notifications
  const bulkOperationStarted = useCallback((operationType: string, count: number) => {
    return info(
      'Bulk Operation Started',
      `${operationType} operation started for ${count} allowances`,
      { persistent: true }
    );
  }, [info]);

  const bulkOperationCompleted = useCallback((
    operationType: string,
    successful: number,
    failed: number,
    total: number
  ) => {
    const isFullSuccess = failed === 0;
    const notificationType = isFullSuccess ? 'success' : 'warning';
    
    return addNotification(
      notificationType,
      'Bulk Operation Completed',
      `${operationType}: ${successful}/${total} successful${failed > 0 ? `, ${failed} failed` : ''}`,
      { duration: 10000 }
    );
  }, [addNotification]);

  // Security notifications
  const securityWarning = useCallback((title: string, message: string, severity: 'low' | 'medium' | 'high') => {
    const type = severity === 'high' ? 'error' : 'warning';
    const persistent = severity === 'high';
    
    return addNotification(
      type,
      `Security ${severity === 'high' ? 'Alert' : 'Warning'}: ${title}`,
      message,
      { persistent }
    );
  }, [addNotification]);

  // Validation notifications
  const validationError = useCallback((field: string, message: string) => {
    return warning(
      'Validation Error',
      `${field}: ${message}`,
      { duration: 5000 }
    );
  }, [warning]);

  // Network status notifications
  const networkError = useCallback((message: string, retryAction?: () => void) => {
    const actions: NotificationAction[] = [];
    
    if (retryAction) {
      actions.push({
        label: 'Retry',
        action: retryAction,
        style: 'primary'
      });
    }

    return error(
      'Network Error',
      message,
      { actions }
    );
  }, [error]);

  const networkReconnected = useCallback(() => {
    return success(
      'Connection Restored',
      'Network connection has been restored',
      { duration: 3000 }
    );
  }, [success]);

  // Export/Import notifications
  const exportCompleted = useCallback((filename: string, recordCount: number) => {
    return success(
      'Export Completed',
      `Successfully exported ${recordCount} allowances to ${filename}`,
      { duration: 5000 }
    );
  }, [success]);

  const importCompleted = useCallback((
    imported: number,
    skipped: number,
    errors: number
  ) => {
    const hasErrors = errors > 0;
    const type = hasErrors ? 'warning' : 'success';
    
    return addNotification(
      type,
      'Import Completed',
      `Imported: ${imported}, Skipped: ${skipped}${hasErrors ? `, Errors: ${errors}` : ''}`,
      { duration: 8000 }
    );
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    dismissNotification,
    dismissAll,
    executeAction,
    success,
    error,
    warning,
    info,
    transactionStarted,
    transactionCompleted,
    transactionFailed,
    bulkOperationStarted,
    bulkOperationCompleted,
    securityWarning,
    validationError,
    networkError,
    networkReconnected,
    exportCompleted,
    importCompleted
  };
};

// Helper function to get default duration based on notification type
const getDefaultDuration = (type: Notification['type']): number => {
  switch (type) {
    case 'success':
      return 4000;
    case 'info':
      return 5000;
    case 'warning':
      return 7000;
    case 'error':
      return 0; // Persistent by default
    default:
      return 5000;
  }
};