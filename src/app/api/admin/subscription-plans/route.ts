import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscriptionPlanStorage } from '@/lib/subscription-storage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    // Try to get plans from database first
    let subscriptionPlans = [];
    
    try {
      // Check if we have a subscription plans table or similar
      const dbPlans = await db.subscriptionPlan.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: { createdAt: 'asc' }
      });
      
      if (dbPlans && dbPlans.length > 0) {
        subscriptionPlans = dbPlans.map(plan => ({
          id: plan.id,
          name: plan.name,
          description: plan.description || '',
          price: plan.price || 0,
          duration: plan.duration || 1,
          durationType: plan.durationType || 'monthly',
          features: plan.features || [],
          isActive: plan.isActive,
          maxMembers: plan.maxMembers || 50,
          maxTransactions: plan.maxTransactions || 100
        }));
      }
    } catch (dbError) {
      console.log('Database plans not available, using in-memory storage');
    }
    
    // If no plans in database, use in-memory storage
    if (subscriptionPlans.length === 0) {
      subscriptionPlans = includeInactive 
        ? subscriptionPlanStorage.getAllPlansIncludingInactive()
        : subscriptionPlanStorage.getAllPlans();
    }

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
    const planData = {
      name: body.name,
      description: body.description || '',
      price: body.price,
      duration: body.duration || 1,
      durationType: body.durationType || 'monthly',
      features: body.features || [],
      isActive: body.isActive !== undefined ? body.isActive : true,
      maxMembers: body.maxMembers || 50,
      maxTransactions: body.maxTransactions || 100
    };

    // Try to save to database
    try {
      const savedPlan = await db.subscriptionPlan.create({
        data: {
          ...planData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        }
      });
      
      return NextResponse.json({
        success: true,
        data: savedPlan
      });
    } catch (dbError) {
      console.log('Could not save to database, using in-memory storage');
      
      // Fallback: save to in-memory storage
      const newPlan = subscriptionPlanStorage.createPlan(planData);
      
      return NextResponse.json({
        success: true,
        data: newPlan
      });
    }
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

    const planData = {
      name: body.name,
      description: body.description || '',
      price: body.price,
      duration: body.duration || 1,
      durationType: body.durationType || 'monthly',
      features: body.features || [],
      isActive: body.isActive !== undefined ? body.isActive : true,
      maxMembers: body.maxMembers || 50,
      maxTransactions: body.maxTransactions || 100
    };

    // Try to update in database
    try {
      const updatedPlan = await db.subscriptionPlan.update({
        where: { id: body.id },
        data: {
          ...planData,
          updatedAt: new Date().toISOString()
        }
      });
      
      return NextResponse.json({
        success: true,
        data: updatedPlan
      });
    } catch (dbError) {
      console.log('Could not update in database, using in-memory storage');
      
      // Fallback: update in in-memory storage
      const updatedPlan = subscriptionPlanStorage.updatePlan(body.id, planData);
      
      if (!updatedPlan) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Plan not found' 
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: updatedPlan
      });
    }
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

    // Try to delete from database
    try {
      await db.subscriptionPlan.delete({
        where: { id }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Subscription plan deleted successfully'
      });
    } catch (dbError) {
      console.log('Could not delete from database, using in-memory storage');
      
      // Fallback: delete from in-memory storage
      const deleted = subscriptionPlanStorage.deletePlan(id);
      
      if (!deleted) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Plan not found' 
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Subscription plan deleted successfully'
      });
    }
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