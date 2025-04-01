import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// get the nodes for a skill tree with the skill_tree_slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ skill_tree_slug: string }> }
) {
  const { skill_tree_slug } = await params;

  try {
    const { data, error } = await supabase
      .from('nodes')
      .select('*')
      .eq('skill_tree_slug', skill_tree_slug)

    console.log(data);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: `Nodes not found for the skill tree: ${skill_tree_slug}` }, { status: 404 });
    }

    return NextResponse.json({ nodes: data });
  } catch (error) {
    console.error(`Error fetching nodes for the skill tree: ${skill_tree_slug}`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}