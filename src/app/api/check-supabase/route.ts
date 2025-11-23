import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { success: false, message: "Supabase env missing" },
      { status: 500 }
    );
  }

  const client = createClient(url, key);
  const { data, error } = await client.from("users").select("id").limit(1);

  if (error) {
    return NextResponse.json(
      { success: false, message: "Connection failed", error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Connected to Supabase successfully!",
    sample: data,
  });
}
