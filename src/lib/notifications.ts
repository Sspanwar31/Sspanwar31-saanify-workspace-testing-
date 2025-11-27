import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

interface EmailData {
  to: string
  subject: string
  content: string
  type: 'payment_uploaded' | 'payment_approved' | 'payment_rejected' | 'expiry_reminder' | 'expired'
}

interface NotificationData {
  userId: string
  title: string
  message: string
  type: string
}

export class NotificationService {
  private static async sendEmail(data: EmailData): Promise<boolean> {
    try {
      const zai = await ZAI.create()
      
      // Generate personalized email content using AI
      const emailContent = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an email assistant for Saanify, a society management platform. Generate professional and friendly emails.'
          },
          {
            role: 'user',
            content: `Generate an email with the following details:
            Subject: ${data.subject}
            Content: ${data.content}
            Type: ${data.type}
            
            Make it professional yet friendly, and include proper formatting.`
          }
        ]
      })

      const generatedEmail = emailContent.choices[0]?.message?.content || data.content
      
      // Here you would integrate with your actual email service (SendGrid, AWS SES, etc.)
      // For now, we'll log the email
      console.log('📧 EMAIL SENT:')
      console.log('To:', data.to)
      console.log('Subject:', data.subject)
      console.log('Content:', generatedEmail)
      console.log('---')
      
      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  private static async createNotification(data: NotificationData): Promise<boolean> {
    try {
      await db.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      
      return true
    } catch (error) {
      console.error('Failed to create notification:', error)
      return false
    }
  }

  // Payment uploaded - notify admin
  static async notifyPaymentUploaded(userEmail: string, userName: string, plan: string, amount: number): Promise<void> {
    try {
      // Get all admin users
      const adminUsers = await db.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPERADMIN'] } }
      })

      // Create notifications for all admins
      for (const admin of adminUsers) {
        await this.createNotification({
          userId: admin.id,
          title: 'New Payment Approval Required 💳',
          message: `${userName} has submitted a payment of ₹${amount} for the ${plan} plan. Please review and approve.`,
          type: 'payment'
        })

        // Send email to admin
        await this.sendEmail({
          to: admin.email || '',
          subject: 'New Payment Approval Required - Saanify',
          content: `A new payment requires your approval:
          
          User: ${userName} (${userEmail})
          Plan: ${plan}
          Amount: ₹${amount}
          
          Please log in to the admin dashboard to review and approve this payment.`,
          type: 'payment_uploaded'
        })
      }
    } catch (error) {
      console.error('Failed to notify admins about payment upload:', error)
    }
  }

  // Payment approved - notify user
  static async notifyPaymentApproved(userEmail: string, userName: string, plan: string, userId: string): Promise<void> {
    try {
      // Create in-app notification
      await this.createNotification({
        userId,
        title: 'Payment Approved! 🎉',
        message: `Your payment for the ${plan} plan has been approved. Your subscription is now active! Please complete your signup to access the dashboard.`,
        type: 'success'
      })

      // Send email
      await this.sendEmail({
        to: userEmail,
        subject: 'Payment Approved - Welcome to Saanify! 🎉',
        content: `Dear ${userName},

        Great news! Your payment for the ${plan} plan has been approved.

        Your subscription is now active and you can:
        ✅ Complete your signup process
        ✅ Access all features of your ${plan} plan
        ✅ Start managing your society efficiently

        Click here to complete your signup: [Login Link]

        Thank you for choosing Saanify!

        Best regards,
        The Saanify Team`,
        type: 'payment_approved'
      })
    } catch (error) {
      console.error('Failed to notify user about payment approval:', error)
    }
  }

  // Payment rejected - notify user
  static async notifyPaymentRejected(userEmail: string, userName: string, plan: string, userId: string): Promise<void> {
    try {
      // Create in-app notification
      await this.createNotification({
        userId,
        title: 'Payment Rejected ❌',
        message: `Your payment for the ${plan} plan could not be verified. Please reupload your payment proof or contact support.`,
        type: 'error'
      })

      // Send email
      await this.sendEmail({
        to: userEmail,
        subject: 'Payment Verification Failed - Saanify',
        content: `Dear ${userName},

        We regret to inform you that your payment for the ${plan} plan could not be verified.

        What you can do:
        🔄 Reupload your payment proof with clearer images
        📞 Contact our support team for assistance
        📧 Email us at support@saanify.com

        To reupload your payment, please visit: [Subscription Page]

        If you need help, our support team is here to assist you.

        Best regards,
        The Saanify Team`,
        type: 'payment_rejected'
      })
    } catch (error) {
      console.error('Failed to notify user about payment rejection:', error)
    }
  }

  // Expiry reminder - 2 days before
  static async sendExpiryReminder(userEmail: string, userName: string, plan: string, expiryDate: Date, userId: string): Promise<void> {
    try {
      // Create in-app notification
      await this.createNotification({
        userId,
        title: 'Subscription Expiring Soon ⏰',
        message: `Your ${plan} subscription will expire in 2 days (${expiryDate.toLocaleDateString()}). Renew now to continue using Saanify.`,
        type: 'warning'
      })

      // Send email
      await this.sendEmail({
        to: userEmail,
        subject: 'Subscription Expiring Soon - Saanify',
        content: `Dear ${userName},

        This is a friendly reminder that your ${plan} subscription will expire in 2 days.

        Expiry Date: ${expiryDate.toLocaleDateString()}

        To continue enjoying all features of Saanify:
        🔄 Renew your subscription before expiry
        💾 Save your data (if needed)
        📞 Contact support if you need assistance

        Renew now: [Subscription Page]

        We value your business and look forward to continuing to serve you.

        Best regards,
        The Saanify Team`,
        type: 'expiry_reminder'
      })
    } catch (error) {
      console.error('Failed to send expiry reminder:', error)
    }
  }

  // Subscription expired
  static async notifySubscriptionExpired(userEmail: string, userName: string, plan: string, userId: string): Promise<void> {
    try {
      // Create in-app notification
      await this.createNotification({
        userId,
        title: 'Subscription Expired ⏰',
        message: `Your ${plan} subscription has expired. Please renew to continue using Saanify features.`,
        type: 'error'
      })

      // Send email
      await this.sendEmail({
        to: userEmail,
        subject: 'Subscription Expired - Saanify',
        content: `Dear ${userName},

        Your ${plan} subscription has expired.

        What happens now:
        🔒 Your access to premium features is suspended
        📊 Your data remains safe
        🔄 You can renew anytime to restore access

        To continue using Saanify:
        💳 Choose a new subscription plan
        📞 Contact support for assistance

        Renew now: [Subscription Page]

        We hope to see you back soon!

        Best regards,
        The Saanify Team`,
        type: 'expired'
      })
    } catch (error) {
      console.error('Failed to notify user about subscription expiry:', error)
    }
  }

  // Check for expiring subscriptions (should be run daily)
  static async checkAndSendExpiryReminders(): Promise<void> {
    try {
      const twoDaysFromNow = new Date()
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)

      const expiringUsers = await db.user.findMany({
        where: {
          subscriptionStatus: 'ACTIVE',
          expiryDate: {
            lte: twoDaysFromNow,
            gte: new Date()
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          expiryDate: true
        }
      })

      for (const user of expiringUsers) {
        if (user.expiryDate) {
          await this.sendExpiryReminder(
            user.email || '',
            user.name || 'User',
            user.plan || 'UNKNOWN',
            user.expiryDate,
            user.id
          )
        }
      }
    } catch (error) {
      console.error('Failed to check expiry reminders:', error)
    }
  }

  // Check for expired subscriptions (should be run daily)
  static async checkAndUpdateExpiredSubscriptions(): Promise<void> {
    try {
      const now = new Date()

      const expiredUsers = await db.user.findMany({
        where: {
          subscriptionStatus: 'ACTIVE',
          expiryDate: {
            lt: now
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          plan: true
        }
      })

      for (const user of expiredUsers) {
        // Update subscription status
        await db.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: 'EXPIRED',
            updatedAt: new Date()
          }
        })

        // Send notification
        await this.notifySubscriptionExpired(
          user.email || '',
          user.name || 'User',
          user.plan || 'UNKNOWN',
          user.id
        )
      }
    } catch (error) {
      console.error('Failed to update expired subscriptions:', error)
    }
  }
}