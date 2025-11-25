import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // For now, return mock subscription plans data
    // In a real implementation, this would come from the database
    const subscriptionPlans = [
      {
        id: 'basic',
        name: 'Basic',
        price: 0,
        features: ['Up to 50 members', 'Basic reporting', 'Email support'],
        maxMembers: 50,
        duration: 'monthly'
      },
      {
        id: 'professional',
        name: 'Professional',
        price: 99,
        features: ['Up to 200 members', 'Advanced reporting', 'Priority support', 'API access'],
        maxMembers: 200,
        duration: 'monthly'
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 299,
        features: ['Unlimited members', 'Custom reports', 'Dedicated support', 'Full API access', 'Custom integrations'],
        maxMembers: -1,
        duration: 'monthly'
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

    // For now, just return success
    // In a real implementation, this would save to the database
    const newPlan = {
      id: body.name.toLowerCase().replace(/\s+/g, '-'),
      name: body.name,
      price: body.price,
      features: body.features,
      maxMembers: body.maxMembers || -1,
      duration: body.duration || 'monthly',
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

    // For now, just return success with updated data
    // In a real implementation, this would update the database
    const updatedPlan = {
      id: body.id,
      name: body.name,
      price: body.price,
      features: body.features,
      maxMembers: body.maxMembers || -1,
      duration: body.duration || 'monthly',
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
    // In a real implementation, this would delete from the database
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