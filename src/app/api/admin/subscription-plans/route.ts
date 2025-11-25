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