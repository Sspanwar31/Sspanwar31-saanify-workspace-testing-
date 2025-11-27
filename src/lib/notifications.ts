import { db } from '@/lib/db'

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: Date
  data?: any
}

export class NotificationService {
  // Create a new notification
  static async createNotification(data: {
    userId: string
    title: string
    message: string
    type?: 'info' | 'success' | 'warning' | 'error'
    data?: any
  }) {
    try {
      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        read: false,
        createdAt: new Date(),
        data: data.data
      }

      if (!global.notifications) {
        global.notifications = []
      }
      global.notifications.push(notification)

      global.notifications = global.notifications.filter(
        (n: any) => n.userId !== data.userId || 
        global.notifications.filter((x: any) => x.userId === data.userId).length <= 100
      )

      return notification
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  static async getUserNotifications(userId: string, limit: number = 50) {
    try {
      if (!global.notifications) {
        global.notifications = []
      }
      
      const userNotifications = global.notifications
        .filter((n: any) => n.userId === userId)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit)

      return userNotifications
    } catch (error) {
      console.error('Error getting notifications:', error)
      return []
    }
  }

  static async markAsRead(notificationId: string, userId: string) {
    try {
      if (!global.notifications) {
        return false
      }

      const notification = global.notifications.find((n: any) => 
        n.id === notificationId && n.userId === userId
      )

      if (notification) {
        notification.read = true
        return true
      }

      return false
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }

  static async markAllAsRead(userId: string) {
    try {
      if (!global.notifications) {
        return false
      }

      global.notifications.forEach((n: any) => {
        if (n.userId === userId) {
          n.read = true
        }
      })

      return true
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return false
    }
  }

  static async deleteNotification(notificationId: string, userId: string) {
    try {
      if (!global.notifications) {
        return false
      }

      const index = global.notifications.findIndex((n: any) => 
        n.id === notificationId && n.userId === userId
      )

      if (index !== -1) {
        global.notifications.splice(index, 1)
        return true
      }

      return false
    } catch (error) {
      console.error('Error deleting notification:', error)
      return false
    }
  }

  static async getUnreadCount(userId: string) {
    try {
      if (!global.notifications) {
        return 0
      }

      return global.notifications.filter((n: any) => 
        n.userId === userId && !n.read
      ).length
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  static async createSystemNotification(userId: string, event: string, data?: any) {
    const notifications = {
      'customer_added': {
        title: 'New Customer Added',
        message: `A new customer has been added to the system.`,
        type: 'success' as const
      },
      'trial_expiring': {
        title: 'Trial Expiring Soon',
        message: `Customer trial is expiring soon.`,
        type: 'warning' as const
      },
      'payment_received': {
        title: 'Payment Received',
        message: `A new payment has been received.`,
        type: 'success' as const
      },
      'system_backup': {
        title: 'Backup Completed',
        message: `System backup has been completed successfully.`,
        type: 'success' as const
      },
      'system_error': {
        title: 'System Error',
        message: `An error occurred in the system.`,
        type: 'error' as const
      }
    }

    const notification = notifications[event as keyof typeof notifications]
    if (notification) {
      return await this.createNotification({
        userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data
      })
    }
  }
}

declare global {
  var notifications: Notification[] | undefined
}