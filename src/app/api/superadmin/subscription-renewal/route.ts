import { NextRequest, NextResponse } from 'next/server';

// Sample data - in production this would come from database
let clientSubscriptions = [
  {
    id: "1",
    clientId: "client1",
    clientName: "Rajesh Kumar",
    societyName: "Shanti Niketan Society",
    planId: "2",
    planName: "Standard Plan",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "active",
    amount: 1999,
    paymentStatus: "paid"
  },
  {
    id: "2",
    clientId: "client2",
    clientName: "Amit Sharma",
    societyName: "Green Valley Apartments",
    planId: "1",
    planName: "Basic Plan",
    startDate: "2024-06-01",
    endDate: "2024-11-30",
    status: "expired",
    amount: 999,
    paymentStatus: "overdue"
  }
];

// Sample plans for reference
const subscriptionPlans = [
  {
    id: "1",
    name: "Basic Plan",
    price: 999,
    duration: 1,
    durationType: "monthly"
  },
  {
    id: "2",
    name: "Standard Plan",
    price: 1999,
    duration: 1,
    durationType: "monthly"
  },
  {
    id: "3",
    name: "Premium Plan",
    price: 4999,
    duration: 1,
    durationType: "monthly"
  },
  {
    id: "4",
    name: "Enterprise Annual",
    price: 49999,
    duration: 1,
    durationType: "yearly"
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');

    let filteredSubscriptions = clientSubscriptions;

    // Filter by client ID if provided
    if (clientId) {
      filteredSubscriptions = filteredSubscriptions.filter(sub => sub.clientId === clientId);
    }

    // Filter by status if provided
    if (status) {
      filteredSubscriptions = filteredSubscriptions.filter(sub => sub.status === status);
    }

    // Get subscriptions that are expiring soon (within 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const expiringSoon = filteredSubscriptions.filter(sub => {
      const endDate = new Date(sub.endDate);
      return endDate <= thirtyDaysFromNow && endDate >= today && sub.status === 'active';
    });

    // Get expired subscriptions
    const expired = filteredSubscriptions.filter(sub => {
      const endDate = new Date(sub.endDate);
      return endDate < today && sub.status !== 'renewed';
    });

    return NextResponse.json({
      success: true,
      data: {
        all: filteredSubscriptions,
        expiringSoon,
        expired,
        renewalStats: {
          total: filteredSubscriptions.length,
          active: filteredSubscriptions.filter(sub => sub.status === 'active').length,
          expired: expired.length,
            expiringSoon: expiringSoon.length
        }
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch renewal data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, newPlanId, renewalStartDate, customAmount, renewalType } = body;

    // Validation
    if (!subscriptionId || !newPlanId || !renewalStartDate) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the existing subscription
    const existingSubscription = clientSubscriptions.find(sub => sub.id === subscriptionId);
    if (!existingSubscription) {
      return NextResponse.json(
        { success: false, error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Find the new plan
    const newPlan = subscriptionPlans.find(p => p.id === newPlanId);
    if (!newPlan) {
      return NextResponse.json(
        { success: false, error: "New plan not found" },
        { status: 404 }
      );
    }

    // Calculate new end date
    const endDate = new Date(renewalStartDate);
    if (newPlan.durationType === 'monthly') {
      endDate.setMonth(endDate.getMonth() + newPlan.duration);
    } else {
      endDate.setFullYear(endDate.getFullYear() + newPlan.duration);
    }

    // Create renewed subscription
    const renewedSubscription = {
      id: Date.now().toString(),
      clientId: existingSubscription.clientId,
      clientName: existingSubscription.clientName,
      societyName: existingSubscription.societyName,
      planId: newPlanId,
      planName: newPlan.name,
      startDate: renewalStartDate,
      endDate: endDate.toISOString().split('T')[0],
      status: "active",
      amount: customAmount ? parseInt(customAmount) : newPlan.price,
      paymentStatus: "pending",
      renewalType: renewalType || "manual", // manual, automatic, upgrade
      previousSubscriptionId: subscriptionId
    };

    // Add the new subscription
    clientSubscriptions.push(renewedSubscription);

    // Update old subscription status
    const oldSubscriptionIndex = clientSubscriptions.findIndex(sub => sub.id === subscriptionId);
    if (oldSubscriptionIndex !== -1) {
      clientSubscriptions[oldSubscriptionIndex].status = "renewed";
    }

    return NextResponse.json({
      success: true,
      data: renewedSubscription,
      message: "Subscription renewed successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to renew subscription" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, paymentStatus } = body;

    if (!subscriptionId || !paymentStatus) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const subscriptionIndex = clientSubscriptions.findIndex(sub => sub.id === subscriptionId);
    if (subscriptionIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Update payment status
    clientSubscriptions[subscriptionIndex].paymentStatus = paymentStatus;

    return NextResponse.json({
      success: true,
      data: clientSubscriptions[subscriptionIndex],
      message: "Payment status updated successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update payment status" },
      { status: 500 }
    );
  }
}