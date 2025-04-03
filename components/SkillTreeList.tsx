"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SkillTree {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface UserSkillTree {
  skill_tree_slug: string;
  status: 'in_progress' | 'completed';
}

interface SkillTreeListProps {
  status: 'not_started' | 'in_progress' | 'completed';
}

export default function SkillTreeList({ status }: SkillTreeListProps) {
  const [trees, setTrees] = useState<SkillTree[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrees = async () => {
      try {
        const response = await fetch('/api/skill-trees');
        if (!response.ok) throw new Error('Failed to fetch skill trees');
        const data = await response.json();
        
        const userResponse = await fetch('/api/user-skill-trees');
        if (!userResponse.ok) throw new Error('Failed to fetch user progress');
        const userData = await userResponse.json();
        
        const filteredTrees = data.skill_trees.filter((tree: SkillTree) => {
          const userTree = userData.skill_trees.find(
            (ut: UserSkillTree) => ut.skill_tree_slug === tree.slug
          );
          
          if (status === 'not_started') return !userTree;
          if (status === 'in_progress') return userTree?.status === 'in_progress';
          if (status === 'completed') return userTree?.status === 'completed';
          
          return false;
        });
        
        setTrees(filteredTrees);
      } catch (error) {
        console.error('Error fetching trees:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrees();
  }, [status]);

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (trees.length === 0) return <div className="text-gray-500">No skill trees found</div>;

  return (
    <div className="space-y-4">
      {trees.map((tree) => (
        <Link
          key={tree.id}
          href={`/skill-tree/${tree.slug}`}
          className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <h3 className="font-medium text-gray-900">{tree.name}</h3>
          <p className="text-sm text-gray-500">{tree.description}</p>
        </Link>
      ))}
    </div>
  );
} 