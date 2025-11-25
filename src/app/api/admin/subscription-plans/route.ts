import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Return mock subscription plans data that matches the frontend interface
    const subscriptionPlans = [
      {
        id: '1',
        name: 'Basic Plan',
        description: 'Perfect for small societies',
        price: 0,
        duration: 1,
        durationType: 'monthly' as 'monthly' | 'yearly',
        features: ['Up to 50 members', 'Basic transactions', 'Email support'],
        isActive: true,
        maxMembers: 50,
        maxTransactions: 100
      },
      {
        id: '2',
        name: 'Standard Plan',
        description: 'Great for medium societies',
        price: 1999,
        duration: 1,
        durationType: 'monthly' as 'monthly' | 'yearly',
        features: ['Up to 200 members', 'Advanced transactions', 'Priority support', 'Mobile app access'],
        isActive: true,
        maxMembers: 200,
        maxTransactions: 500
      },
      {
        id: '3',
        name: 'Premium Plan',
        description: 'Best for large societies',
        price: 4999,
        duration: 1,
        durationType: 'monthly' as 'monthly' | 'yearly',
        features: ['Unlimited members', 'Unlimited transactions', '24/7 support', 'Advanced analytics', 'Custom features'],
        isActive: true,
        maxMembers: 999,
        maxTransactions: 9999
      },
      {
        id: '4',
        name: 'Enterprise Annual',
        description: 'Complete solution for enterprises',
        price: 49999,
        duration: 1,
        durationType: 'yearly' as 'monthly' | 'yearly',
        features: ['Everything in Premium', 'Dedicated account manager', 'Custom integrations', 'On-premise option'],
        isActive: true,
        maxMembers: 9999,
        maxTransactions: 99999
      }
    ];

    return NextResponse.json({
      success: true,
      data: subscriptionPlans
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch subscription plans' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.price || !body.features) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: name, price, features' 
        },
        { status: 400 }
      );
    }

    // Create new plan with proper structure
    const newPlan = {
      id: Date.now().toString(),
      name: body.name,
      description: body.description || '',
      price: body.price,
      duration: body.duration || 1,
      durationType: body.durationType || 'monthly',
      features: body.features || [],
      isActive: body.isActive !== undefined ? body.isActive : true,
      maxMembers: body.maxMembers || 50,
      maxTransactions: body.maxTransactions || 100,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: newPlan
    });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create subscription plan' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.id || !body.name || !body.price || !body.features) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: id, name, price, features' 
        },
        { status: 400 }
      );
    }

    // Update plan with proper structure
    const updatedPlan = {
      id: body.id,
      name: body.name,
      description: body.description || '',
      price: body.price,
      duration: body.duration || 1,
      durationType: body.durationType || 'monthly',
      features: body.features || [],
      isActive: body.isActive !== undefined ? body.isActive : true,
      maxMembers: body.maxMembers || 50,
      maxTransactions: body.maxTransactions || 100,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: updatedPlan
    });
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update subscription plan' 
      },
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
        { 
          success: false, 
          error: 'Missing required parameter: id' 
        },
        { status: 400 }
      );
    }

    // For now, just return success
    // In a real implementation, this would delete from database
    return NextResponse.json({
      success: true,
      message: 'Subscription plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete subscription plan' 
      },
      { status: 500 }
    );
  }
}