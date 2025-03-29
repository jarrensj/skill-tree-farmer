import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// get a skill tree by slug
export async function GET(
  req: NextRequest,
  context: { params: { slug: string } }
) {
  const { slug } = context.params;

  try {
    const { data, error } = await supabase
      .from('skill_trees')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: "Skill tree not found" }, { status: 404 });
    }
    
    return NextResponse.json({ skill_tree: data });
  } catch (error) {
    console.error('Error fetching skill tree:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
