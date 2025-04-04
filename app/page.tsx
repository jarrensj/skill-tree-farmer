import { auth } from "@clerk/nextjs/server";
import SkillTreeList from "@/components/SkillTreeList";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">skill tree</h1>
          
          {!userId ? (
            <div className="flex flex-col items-center gap-4">
              sign in to see your skill trees
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Not Started</h2>
                <SkillTreeList status="not_started" />
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">In Progress</h2>
                <SkillTreeList status="in_progress" />
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed</h2>
                <SkillTreeList status="completed" />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
