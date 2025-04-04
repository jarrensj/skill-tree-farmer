import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || "", 
);

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('skill_trees')
      .eq('clerk_id', userId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ skill_trees: data.skill_trees || [] });
  } catch (error) {
    console.error('Error fetching user skill trees:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { skill_tree_slug, status } = body;

    if (!skill_tree_slug || !status) {
      return NextResponse.json({ error: "skill_tree_slug and status are required" }, { status: 400 });
    }

    if (status !== 'in_progress' && status !== 'completed') {
      return NextResponse.json({ error: "Status must be 'in_progress' or 'completed'" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('users')
      .select('skill_trees')
      .eq('clerk_id', userId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const skillTrees = Array.isArray(data.skill_trees) ? data.skill_trees : [];
    
    const existingIndex = skillTrees.findIndex(
      (tree: { skill_tree_slug: string }) => tree.skill_tree_slug === skill_tree_slug
    );

    let updatedSkillTrees;
    if (existingIndex !== -1) {
      updatedSkillTrees = [...skillTrees];
      updatedSkillTrees[existingIndex] = { 
        ...updatedSkillTrees[existingIndex], 
        status 
      };
    } else {
      updatedSkillTrees = [
        ...skillTrees,
        { skill_tree_slug, status }
      ];
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ skill_trees: updatedSkillTrees })
      .eq('clerk_id', userId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Skill tree status updated successfully",
      skill_trees: updatedSkillTrees
    });
  } catch (error) {
    console.error('Error updating skill tree status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 