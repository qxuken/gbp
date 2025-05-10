import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  return (
    <>
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Genshin Build Planner
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Plan your perfect builds, manage your teams, and track your farming
            progress all in one place.
          </p>
          <button
            onClick={() => navigate({ to: '/builds' })}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-lg transition-colors duration-200"
          >
            Get Started
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">
              Character Builds
            </h3>
            <p className="text-muted-foreground">
              Create and manage detailed character builds with artifact sets,
              weapons, and substats.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-xl font-semibold mb-4 text-purple-400">
              Team Management
            </h3>
            <p className="text-muted-foreground">
              Organize your teams and optimize your party compositions for
              different content.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-xl font-semibold mb-4 text-green-400">
              Farming Tracker
            </h3>
            <p className="text-muted-foreground">
              Track your farming progress and plan your resource allocation
              efficiently.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
