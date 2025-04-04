import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || "", 
);

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
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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

    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('skill_tree_slug', skill_tree_slug)
      .single();

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('skill_trees')
      .eq('clerk_id', userId)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    const userSkillTrees = userData?.skill_trees || [];
    
    const existingSkillTree = userSkillTrees.find(
      (tree: { skill_tree_slug: string }) => tree.skill_tree_slug === skill_tree_slug
    );

    if (existingProgress) {
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
    
    if (!existingSkillTree) {
      const currentSkillTrees = Array.isArray(userSkillTrees) ? userSkillTrees : [];
      
      const updatedSkillTrees = [
        ...currentSkillTrees,
        { skill_tree_slug, status: 'in_progress' }
      ];
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ skill_trees: updatedSkillTrees })
        .eq('clerk_id', userId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ message: "Progress updated successfully" });
  } catch (error: unknown) {
    console.error('Error updating user progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 