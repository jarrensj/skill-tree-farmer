import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import SkillTree from "@/components/SkillTree";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface UserSkillTreeProgress {
  skill_tree_slug: string;
  status: "in_progress" | "completed";
}

export default async function SkillTreePage({ params }: PageProps) {
  const { userId } = await auth();
  const { slug } = await params;

  const { data: skill_trees } = await supabase
    .from('skill_trees')
    .select('*');
  
  const skillTree = skill_trees?.find(tree => tree.slug === slug);
  if (!skillTree) notFound();

  const { data: nodes } = await supabase
    .from('nodes')
    .select('*')
    .eq('skill_tree_slug', slug);

  let userProgress = null;
  if (userId) {
    const { data: userData } = await supabase
      .from('users')
      .select('skill_trees')
      .eq('clerk_id', userId)
      .single();
    
    if (userData?.skill_trees) {
      userProgress = userData.skill_trees.find(
        (tree: UserSkillTreeProgress) => tree.skill_tree_slug === slug
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{skillTree.name}</h1>
          <p className="text-gray-600 mb-8">{skillTree.description}</p>
          
          {userId ? (
            userProgress ? (
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-700">Status: </span>
                <span className="text-sm text-gray-600 capitalize">
                  {userProgress.status.replace('_', ' ')}
                </span>
              </div>
            ) : (
              <div className="mb-4 text-gray-600">Not started</div>
            )
          ) : (
            <div className="mb-4 text-gray-600">Sign in to track your progress</div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <SkillTree nodes={nodes || []} skillTreeSlug={slug} />
          </div>
        </div>
      </main>
    </div>
  );
} 