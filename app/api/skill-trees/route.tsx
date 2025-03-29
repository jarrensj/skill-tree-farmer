import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// get all skill trees
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('skill_trees')
      .select('*')
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ skill_trees: data });
  } catch (error) {
    console.error('Error fetching skill trees:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
