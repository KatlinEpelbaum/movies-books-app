import { getUserStats } from "@/app/actions";
import { StatsClient } from "./stats-client";

export default async function StatsPage() {
  const stats = await getUserStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Your Stats</h1>
        <p className="text-muted-foreground">
          A look at your media consumption habits.
        </p>
      </div>

      <StatsClient stats={stats} />
    </div>
  );
}
