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

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: clientSubscriptions
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch client subscriptions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, planId, startDate, societyName, customAmount } = body;

    // Validation
    if (!clientId || !planId || !startDate || !societyName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the plan
    const plan = subscriptionPlans.find(p => p.id === planId);
    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Subscription plan not found" },
        { status: 404 }
      );
    }

    // Calculate end date
    const endDate = new Date(startDate);
    if (plan.durationType === 'monthly') {
      endDate.setMonth(endDate.getMonth() + plan.duration);
    } else {
      endDate.setFullYear(endDate.getFullYear() + plan.duration);
    }

    // Create new subscription
    const newSubscription = {
      id: Date.now().toString(),
      clientId,
      clientName: "Client Name", // In production, this would come from client data
      societyName,
      planId,
      planName: plan.name,
      startDate,
      endDate: endDate.toISOString().split('T')[0],
      status: "active",
      amount: customAmount ? parseInt(customAmount) : plan.price,
      paymentStatus: "pending"
    };

    clientSubscriptions.push(newSubscription);

    return NextResponse.json({
      success: true,
      data: newSubscription,
      message: "Client subscription activated successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to activate client subscription" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    const subscriptionIndex = clientSubscriptions.findIndex(sub => sub.id === id);
    if (subscriptionIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Client subscription not found" },
        { status: 404 }
      );
    }

    // Update the subscription
    clientSubscriptions[subscriptionIndex] = {
      ...clientSubscriptions[subscriptionIndex],
      ...updateData,
      id // Ensure ID doesn't change
    };

    return NextResponse.json({
      success: true,
      data: clientSubscriptions[subscriptionIndex],
      message: "Client subscription updated successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update client subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    const subscriptionIndex = clientSubscriptions.findIndex(sub => sub.id === id);
    if (subscriptionIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Client subscription not found" },
        { status: 404 }
      );
    }

    clientSubscriptions.splice(subscriptionIndex, 1);

    return NextResponse.json({
      success: true,
      message: "Client subscription deleted successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete client subscription" },
      { status: 500 }
    );
  }
}