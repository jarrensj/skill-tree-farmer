"use client"
import React, { useEffect } from 'react';
import Image from 'next/image';

interface Node {
  id: string;
  node_identifier: string;
  name: string;
  description: string;
  image: string;
  children: string[] | null;
  prereq: string[] | null;
  skill_tree_slug: string;
}

interface NodesDisplayProps {
  nodes: Node[];
  skillTreeSlug: string;
}

export default function NodesDisplay({ nodes, skillTreeSlug }: NodesDisplayProps) {
  const [unlockedNodes, setUnlockedNodes] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/user-progress?skill_tree_slug=${skillTreeSlug}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch progress');
        }
        const data = await response.json();
        if (data.progress?.nodes_unlocked) {
          setUnlockedNodes(new Set(data.progress.nodes_unlocked));
        }
      } catch (error) {
        console.error('Error fetching user progress:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch progress');
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [skillTreeSlug]);

  // check if a node can be unlocked
  const canUnlock = (node: Node) => {
    if (!node.prereq || node.prereq.length === 0) return true;
    return node.prereq.every(prereqId => unlockedNodes.has(prereqId));
  };

  // handle node click
  const handleNodeClick = async (node: Node) => {
    if (!canUnlock(node)) return;
    setError(null);

    try {
      const response = await fetch('/api/user-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skill_tree_slug: skillTreeSlug,
          node_identifier: node.node_identifier,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update progress');
      }

      setUnlockedNodes(prev => new Set([...prev, node.node_identifier]));
    } catch (error) {
      console.error('Error updating progress:', error);
      setError(error instanceof Error ? error.message : 'Failed to update progress');
    }
  };

  if (loading) {
    return <div className="text-center">Loading progress...</div>;
  }

  // calculate positions for each node
  const nodePositions = new Map<string, { x: number, y: number }>();
  const levelMap = new Map<string, number>();
  
  // calculate levels for each node
  const calculateLevels = (nodeIdentifier: string, level: number = 0) => {
    const node = nodes.find(n => n.node_identifier === nodeIdentifier);
    if (!node) return;
    
    const currentLevel = levelMap.get(nodeIdentifier) ?? level;
    levelMap.set(nodeIdentifier, Math.max(currentLevel, level));
    
    if (node.children) {
      node.children.forEach(childId => {
        calculateLevels(childId, level + 1);
      });
    }
  };

  // find root nodes (nodes with no prerequisites)
  const rootNodes = nodes.filter(node => !node.prereq || node.prereq.length === 0);
  rootNodes.forEach(node => calculateLevels(node.node_identifier));

  // calculate x and y positions
  const VERTICAL_SPACING = 200; 
  const HORIZONTAL_SPACING = 120;

  nodes.forEach(node => {
    const level = levelMap.get(node.node_identifier) || 0;
    const nodesAtLevel = Array.from(levelMap.entries())
      .filter(([, l]) => l === level).length;
    const nodeIndex = Array.from(levelMap.entries())
      .filter(([, l]) => l === level)
      .findIndex(([id]) => id === node.node_identifier);
    
    const totalWidth = (nodesAtLevel - 1) * HORIZONTAL_SPACING;
    const startX = (800 - totalWidth) / 2;
    
    nodePositions.set(node.node_identifier, {
      x: startX + (nodeIndex * HORIZONTAL_SPACING),
      y: level * VERTICAL_SPACING + 100
    });
  });

  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      )}
      <div className="relative w-[800px] h-[1000px] overflow-auto">
        <svg className="absolute top-0 left-0 w-full h-full">
          {nodes.map(node => 
            node.children ? node.children.map(childId => {
              const startPos = nodePositions.get(node.node_identifier);
              const endPos = nodePositions.get(childId);
              if (!startPos || !endPos) return null;
              
              const midY = (startPos.y + endPos.y) / 2;
              const path = `M ${startPos.x} ${startPos.y} 
                           C ${startPos.x} ${midY},
                             ${endPos.x} ${midY},
                             ${endPos.x} ${endPos.y}`;
              
              const isUnlocked = unlockedNodes.has(node.node_identifier) && unlockedNodes.has(childId);
              
              return (
                <path
                  key={`${node.node_identifier}-${childId}`}
                  d={path}
                  fill="none"
                  stroke={isUnlocked ? "#4CAF50" : "#999"}
                  strokeWidth="2"
                  opacity={isUnlocked ? 1 : 0.5}
                />
              );
            }) : null
          )}
        </svg>
        
        {nodes.map((node) => {
          const position = nodePositions.get(node.node_identifier);
          if (!position) return null;
          
          const isUnlocked = unlockedNodes.has(node.node_identifier);
          const isAvailable = canUnlock(node);
          
          return (
            <div
              key={node.node_identifier}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 w-24 h-24"
              style={{
                left: position.x,
                top: position.y,
              }}
            >
              <div 
                onClick={() => handleNodeClick(node)}
                className={`w-full h-full rounded-full border-2 
                  ${isUnlocked 
                    ? 'border-green-500 bg-white' 
                    : isAvailable 
                      ? 'border-yellow-500 bg-gray-100 cursor-pointer' 
                      : 'border-gray-300 bg-gray-200'
                  } 
                  hover:shadow-lg transition-all duration-300 p-2 
                  flex flex-col items-center justify-center 
                  ${isAvailable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                {node.image && (
                  <Image
                    src={node.image}
                    alt={node.name}
                    width={32}
                    height={32}
                    className={`object-cover rounded-full mb-1 
                      ${!isUnlocked && 'grayscale'}`}
                  />
                )}
                <span className={`text-xs text-center font-semibold 
                  ${isUnlocked ? 'text-black' : 'text-gray-500'}`}>
                  {node.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
