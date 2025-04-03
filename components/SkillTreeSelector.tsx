"use client"

import React, { useEffect, useState } from 'react';
import SkillTree from './SkillTree';

interface SkillTree {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  category?: string[];
}

interface Node {
  id: string;
  node_identifier: string;
  name: string;
  description: string;
  image: string;
  children: string[];
  prereq: string[];
  skill_tree_slug: string;
  exp: number;
}

export default function SkillTreeSelector() {
  const [skillTrees, setSkillTrees] = useState<SkillTree[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch skill trees on component mount
  useEffect(() => {
    const fetchSkillTrees = async () => {
      try {
        const response = await fetch('/api/skill-trees');
        const data = await response.json();
        setSkillTrees(data.skill_trees);
      } catch (error) {
        console.error('Error fetching skill trees:', error);
      }
    };

    fetchSkillTrees();
  }, []);

  // Fetch nodes when a skill tree is selected
  useEffect(() => {
    const fetchNodes = async () => {
      if (!selectedSlug) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/nodes/${selectedSlug}`);
        const data = await response.json();
        setNodes(data.nodes);
      } catch (error) {
        console.error('Error fetching nodes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNodes();
  }, [selectedSlug]);

  return (
    <div className="flex flex-col items-center gap-4">
      <select
        value={selectedSlug}
        onChange={(e) => setSelectedSlug(e.target.value)}
        className="px-4 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select a skill tree</option>
        {skillTrees.map((tree) => (
          <option key={tree.id} value={tree.slug}>
            {tree.name}
          </option>
        ))}
      </select>

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : selectedSlug && nodes.length > 0 ? (
        <SkillTree nodes={nodes} skillTreeSlug={selectedSlug} />
      ) : selectedSlug ? (
        <div className="text-gray-600">No nodes found for this skill tree</div>
      ) : null}
    </div>
  );
} 