import { NextRequest, NextResponse } from 'next/server';

// Sample data - in production this would come from database
let subscriptionPlans = [
  {
    id: "1",
    name: "Basic Plan",
    description: "Perfect for small societies",
    price: 999,
    duration: 1,
    durationType: "monthly",
    features: ["Up to 50 members", "Basic transactions", "Email support"],
    isActive: true,
    maxMembers: 50,
    maxTransactions: 100
  },
  {
    id: "2",
    name: "Standard Plan",
    description: "Great for medium societies",
    price: 1999,
    duration: 1,
    durationType: "monthly",
    features: ["Up to 200 members", "Advanced transactions", "Priority support", "Mobile app access"],
    isActive: true,
    maxMembers: 200,
    maxTransactions: 500
  },
  {
    id: "3",
    name: "Premium Plan",
    description: "Best for large societies",
    price: 4999,
    duration: 1,
    durationType: "monthly",
    features: ["Unlimited members", "Unlimited transactions", "24/7 support", "Advanced analytics", "Custom features"],
    isActive: true,
    maxMembers: 999,
    maxTransactions: 9999
  },
  {
    id: "4",
    name: "Enterprise Annual",
    description: "Complete solution for enterprises",
    price: 49999,
    duration: 1,
    durationType: "yearly",
    features: ["Everything in Premium", "Dedicated account manager", "Custom integrations", "On-premise option"],
    isActive: true,
    maxMembers: 9999,
    maxTransactions: 99999
  }
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: subscriptionPlans
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch subscription plans" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, duration, durationType, features, maxMembers, maxTransactions, isActive } = body;

    // Validation
    if (!name || !price || !duration || !durationType) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newPlan = {
      id: Date.now().toString(),
      name,
      description: description || "",
      price: parseInt(price),
      duration: parseInt(duration),
      durationType,
      features: features || [],
      isActive: isActive !== undefined ? isActive : true,
      maxMembers: parseInt(maxMembers) || 0,
      maxTransactions: parseInt(maxTransactions) || 0
    };

    subscriptionPlans.push(newPlan);

    return NextResponse.json({
      success: true,
      data: newPlan,
      message: "Subscription plan created successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create subscription plan" },
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
        { success: false, error: "Plan ID is required" },
        { status: 400 }
      );
    }

    const planIndex = subscriptionPlans.findIndex(plan => plan.id === id);
    if (planIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Subscription plan not found" },
        { status: 404 }
      );
    }

    // Update the plan
    subscriptionPlans[planIndex] = {
      ...subscriptionPlans[planIndex],
      ...updateData,
      id // Ensure ID doesn't change
    };

    return NextResponse.json({
      success: true,
      data: subscriptionPlans[planIndex],
      message: "Subscription plan updated successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update subscription plan" },
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
        { success: false, error: "Plan ID is required" },
        { status: 400 }
      );
    }

    const planIndex = subscriptionPlans.findIndex(plan => plan.id === id);
    if (planIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Subscription plan not found" },
        { status: 404 }
      );
    }

    subscriptionPlans.splice(planIndex, 1);

    return NextResponse.json({
      success: true,
      message: "Subscription plan deleted successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete subscription plan" },
      { status: 500 }
    );
  }
}