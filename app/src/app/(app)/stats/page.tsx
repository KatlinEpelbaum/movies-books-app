import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3, Star, CheckCircle, Clock } from "lucide-react";
import { GenreDistributionChart } from "@/components/charts/genre-distribution-chart";
import { CompletedOverTimeChart } from "@/components/charts/completed-over-time-chart";
import { getUserStats } from "@/app/actions";

export default async function StatsPage() {
  const stats = await getUserStats();
  const { totalCompleted, averageRating, genreDistribution, completedOverTime, totalWatchHours, totalWatchMinutes } = stats;

  const topGenre = genreDistribution.length > 0 ? genreDistribution[0].name : "N/A";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Your Stats</h1>
        <p className="text-muted-foreground">
          A look at your media consumption habits.
        </p>
      </div>

      {totalCompleted === 0 ? (
         <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20">
          <p className="text-center text-muted-foreground">
            No stats to show yet. <br/> Start completing items to see your stats here!
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Completed
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCompleted}</div>
                <p className="text-xs text-muted-foreground">items of all time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageRating > 0 ? `${averageRating.toFixed(1)}/5` : 'N/A'}</div>
                <p className="text-xs text-muted-foreground">
                  across all rated media
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Watch Hours</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalWatchHours}h {totalWatchMinutes}m</div>
                <p className="text-xs text-muted-foreground">
                  total time watched
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Genre</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{topGenre}</div>
                <p className="text-xs text-muted-foreground">
                  Your most completed genre
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-4">
              <CompletedOverTimeChart data={completedOverTime} />
            </div>
            <div className="lg:col-span-3">
                <GenreDistributionChart data={genreDistribution} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
