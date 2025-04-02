import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

// Use service role key for backend operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || "", // Use service role key instead of anon key
);

// Get user progress for a specific skill tree
export async function GET(
  request: NextRequest
) {
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const skillTreeSlug = searchParams.get('skill_tree_slug');

  if (!skillTreeSlug) {
    return NextResponse.json({ error: "skill_tree_slug is required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('skill_tree_slug', skillTreeSlug)
      .maybeSingle(); // Use maybeSingle() instead of single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no progress exists yet, return an empty progress object
    if (!data) {
      return NextResponse.json({ 
        progress: {
          user_id: userId,
          skill_tree_slug: skillTreeSlug,
          nodes_unlocked: []
        }
      });
    }

    return NextResponse.json({ progress: data });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update user progress
export async function POST(
  request: NextRequest
) {
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { skill_tree_slug, node_identifier } = body;

    if (!skill_tree_slug || !node_identifier) {
      return NextResponse.json({ error: "skill_tree_slug and node_identifier are required" }, { status: 400 });
    }

    // First, try to get existing progress
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('skill_tree_slug', skill_tree_slug)
      .single();

    if (existingProgress) {
      // Update existing progress
      const updatedNodes = new Set([...existingProgress.nodes_unlocked, node_identifier]);
      const { error } = await supabase
        .from('user_progress')
        .update({
          nodes_unlocked: Array.from(updatedNodes)
        })
        .eq('user_id', userId)
        .eq('skill_tree_slug', skill_tree_slug);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Create new progress record
      const { error } = await supabase
        .from('user_progress')
        .insert({
          user_id: userId,
          skill_tree_slug,
          nodes_unlocked: [node_identifier]
        });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ message: "Progress updated successfully" });
  } catch (error) {
    console.error('Error updating user progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 