import { NextRequest, NextResponse } from 'next/server';
import { githubService } from '@/lib/github';

export async function POST(request: NextRequest) {
  try {
    const { token, repository } = await request.json();

    if (!token || !repository) {
      return NextResponse.json(
        { error: 'Token and repository are required' },
        { status: 400 }
      );
    }

    // Validate repository using the GitHub service
    const validationResult = await githubService.validateRepository(token, repository);

    return NextResponse.json(validationResult);

  } catch (error: any) {
    console.error('Repository validation error:', error);

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return NextResponse.json(
        { 
          error: 'Network error',
          details: 'Unable to connect to GitHub. Please check your internet connection.',
          code: 'NETWORK_ERROR'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: 'An unexpected error occurred while validating the repository.',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}