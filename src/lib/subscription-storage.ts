// Simple in-memory storage for subscription plans
// This will persist plans as long as the server is running

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  durationType: 'monthly' | 'yearly';
  features: string[];
  isActive: boolean;
  maxMembers: number;
  maxTransactions: number;
  createdAt?: string;
  updatedAt?: string;
}

class SubscriptionPlanStorage {
  private plans: SubscriptionPlan[] = [];
  private initialized = false;

  constructor() {
    this.initializeDefaultPlans();
  }

  private initializeDefaultPlans() {
    if (this.initialized) return;

    this.plans = [
      {
        id: '1',
        name: 'Basic',
        description: 'Perfect for small societies',
        price: 4000,
        duration: 1,
        durationType: 'monthly',
        features: ['Up to 50 members', 'Basic transactions', 'Email support', 'Mobile app access'],
        isActive: true,
        maxMembers: 50,
        maxTransactions: 100,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Pro',
        description: 'Best for growing societies',
        price: 7000,
        duration: 1,
        durationType: 'monthly',
        features: ['Up to 200 members', 'Advanced transactions', 'Priority support', 'Mobile app access', 'Advanced analytics'],
        isActive: true,
        maxMembers: 200,
        maxTransactions: 500,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Enterprise',
        description: 'Complete solution for large societies',
        price: 10000,
        duration: 1,
        durationType: 'monthly',
        features: ['Unlimited members', 'Advanced transactions', '24/7 support', 'Mobile app access', 'Advanced analytics', 'Custom integrations'],
        isActive: true,
        maxMembers: 9999,
        maxTransactions: 99999,
        createdAt: new Date().toISOString()
      }
    ];

    this.initialized = true;
  }

  getAllPlans(): SubscriptionPlan[] {
    return this.plans.filter(plan => plan.isActive);
  }

  getAllPlansIncludingInactive(): SubscriptionPlan[] {
    return this.plans; // Return all plans including inactive ones
  }

  getPlanById(id: string): SubscriptionPlan | undefined {
    return this.plans.find(plan => plan.id === id);
  }

  createPlan(planData: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>): SubscriptionPlan {
    const newPlan: SubscriptionPlan = {
      id: Date.now().toString(),
      ...planData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.plans.push(newPlan);
    return newPlan;
  }

  updatePlan(id: string, planData: Partial<SubscriptionPlan>): SubscriptionPlan | null {
    const planIndex = this.plans.findIndex(plan => plan.id === id);
    if (planIndex === -1) return null;

    this.plans[planIndex] = {
      ...this.plans[planIndex],
      ...planData,
      updatedAt: new Date().toISOString()
    };

    return this.plans[planIndex];
  }

  deletePlan(id: string): boolean {
    const planIndex = this.plans.findIndex(plan => plan.id === id);
    if (planIndex === -1) return false;

    this.plans.splice(planIndex, 1);
    return true;
  }

  getValidPlanNames(): string[] {
    return this.plans
      .filter(plan => plan.isActive)
      .map(plan => plan.name.toLowerCase().replace(/\s+/g, ''));
  }
}

// Export singleton instance
export const subscriptionPlanStorage = new SubscriptionPlanStorage();