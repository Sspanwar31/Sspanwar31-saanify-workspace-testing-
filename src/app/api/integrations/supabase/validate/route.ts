import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { handleApiError } from '@/lib/error-handling'

export async function POST(request: NextRequest) {
  try {
    const { supabaseUrl, anonKey } = await request.json()
    
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { error: 'Missing Supabase URL or Anon Key' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(supabaseUrl)
    } catch {
      return NextResponse.json(
        { error: 'Invalid Supabase URL format' },
        { status: 400 }
      )
    }

    // Test connection with provided credentials
    const supabase = createClient(supabaseUrl, anonKey)
    
    // Test basic connectivity with a simple query
    const { data, error } = await supabase.from("users").select("*").limit(1)
    
    if (error) {
      // If table doesn't exist, that's actually okay for validation
      if (error.code === "PGRST116") {
        return NextResponse.json({
          message: "✅ Valid Supabase credentials - Tables not created yet",
          status: "valid",
          needsSetup: true,
          details: {
            url: supabaseUrl,
            connection: "successful",
            tables: "not_created",
            nextStep: "Click 'Save & Setup' to create tables"
          }
        })
      }
      
      // Handle common Supabase errors
      let errorMessage = error.message
      if (error.code === "PGRST301") {
        errorMessage = "Invalid API key or permissions"
      } else if (error.code === "PGRST000") {
        errorMessage = "Invalid database URL or connection refused"
      } else if (error.message?.includes("refused to connect")) {
        errorMessage = "Connection refused - Check URL and credentials"
      }
      
      return NextResponse.json(
        { 
          error: "Invalid Supabase credentials",
          details: errorMessage,
          code: error.code,
          suggestions: [
            "Check your Supabase project URL",
            "Verify anon key permissions",
            "Ensure project is active"
          ]
        },
        { status: 401 }
      )
    }

    // If we get here, connection is successful and tables exist
    return NextResponse.json({
      message: "✅ Valid Supabase credentials - Tables already exist",
      status: "valid",
      needsSetup: false,
      details: {
        url: supabaseUrl,
        connection: "successful",
        tables: "exist",
        nextStep: "You can now use the database"
      }
    })

  } catch (error: any) {
    console.error("Supabase validation error:", error)
    
    // Handle specific error types
    let errorMessage = error.message
    if (error.message?.includes("refused to connect")) {
      errorMessage = "Connection refused - Check your URL and try again"
    }
    
    return NextResponse.json({
      error: "Validation failed",
      details: errorMessage,
      suggestions: [
        "Check Supabase project URL format",
        "Verify your API keys",
        "Ensure project is active in Supabase dashboard"
      ]
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Supabase validation endpoint",
    usage: "POST with { supabaseUrl, anonKey }"
  })
}