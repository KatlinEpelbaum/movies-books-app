"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Star, CheckCircle, Clock, Film, Tv, BookOpen, BookMarked } from "lucide-react";
import { GenreDistributionChart } from "@/components/charts/genre-distribution-chart";
import { CompletedOverTimeChart } from "@/components/charts/completed-over-time-chart";
import type { Stats } from "@/lib/types";

interface StatsClientProps {
  stats: Stats;
}

export function StatsClient({ stats }: StatsClientProps) {
  const [activeTab, setActiveTab] = useState("all");
  
  const { 
    totalCompleted, 
    averageRating, 
    genreDistribution, 
    completedOverTime, 
    totalWatchHours, 
    totalWatchMinutes,
    movieStats,
    tvStats,
    bookStats 
  } = stats;

  const topGenre = genreDistribution.length > 0 ? genreDistribution[0].name : "N/A";

  if (totalCompleted === 0 && movieStats.completed === 0 && tvStats.completed === 0 && bookStats.completed === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20">
        <p className="text-center text-muted-foreground">
          No stats to show yet. <br/> Start completing items to see your stats here!
        </p>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="movies">Movies</TabsTrigger>
        <TabsTrigger value="tv">TV Shows</TabsTrigger>
        <TabsTrigger value="books">Books</TabsTrigger>
      </TabsList>

      {/* All Stats */}
      <TabsContent value="all" className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Completed</CardTitle>
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
              <p className="text-xs text-muted-foreground">across all rated media</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Watch Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWatchHours}h {totalWatchMinutes}m</div>
              <p className="text-xs text-muted-foreground">total time watched</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Genre</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{topGenre}</div>
              <p className="text-xs text-muted-foreground">Your most completed genre</p>
            </CardContent>
          </Card>
        </div>

        {/* Media Type Breakdown */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Movies</CardTitle>
              <Film className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{movieStats.completed}</div>
              <p className="text-xs text-muted-foreground">
                {movieStats.watchHours}h watched • {movieStats.avgRating > 0 ? `${movieStats.avgRating}/5 avg` : 'No ratings'}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">TV Shows</CardTitle>
              <Tv className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tvStats.completed}</div>
              <p className="text-xs text-muted-foreground">
                {tvStats.episodesWatched} episodes • {tvStats.avgRating > 0 ? `${tvStats.avgRating}/5 avg` : 'No ratings'}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Books</CardTitle>
              <BookOpen className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookStats.completed}</div>
              <p className="text-xs text-muted-foreground">
                {bookStats.pagesRead.toLocaleString()} pages • {bookStats.avgRating > 0 ? `${bookStats.avgRating}/5 avg` : 'No ratings'}
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
      </TabsContent>

      {/* Movies Stats */}
      <TabsContent value="movies" className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Movies Completed</CardTitle>
              <Film className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{movieStats.completed}</div>
              <p className="text-xs text-muted-foreground">films watched</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Watch Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{movieStats.watchHours}h</div>
              <p className="text-xs text-muted-foreground">~{Math.round(movieStats.watchHours / 24)} days of movies</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{movieStats.avgRating > 0 ? `${movieStats.avgRating}/5` : 'N/A'}</div>
              <p className="text-xs text-muted-foreground">for movies</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Movie Length</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {movieStats.completed > 0 ? Math.round((movieStats.watchHours * 60) / movieStats.completed) : 0}m
              </div>
              <p className="text-xs text-muted-foreground">per movie</p>
            </CardContent>
          </Card>
        </div>

        {movieStats.completed === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20">
            <p className="text-center text-muted-foreground">
              No movies completed yet. Start watching to see your movie stats!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-4">
              <CompletedOverTimeChart data={movieStats.activityOverTime || completedOverTime} />
            </div>
            <div className="lg:col-span-3">
              <GenreDistributionChart data={movieStats.genreDistribution || genreDistribution} />
            </div>
          </div>
        )}
      </TabsContent>

      {/* TV Shows Stats */}
      <TabsContent value="tv" className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shows Completed</CardTitle>
              <Tv className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tvStats.completed}</div>
              <p className="text-xs text-muted-foreground">series finished</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Episodes Watched</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tvStats.episodesWatched.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">total episodes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Watch Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tvStats.watchHours}h</div>
              <p className="text-xs text-muted-foreground">~{Math.round(tvStats.watchHours / 24)} days of TV</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tvStats.avgRating > 0 ? `${tvStats.avgRating}/5` : 'N/A'}</div>
              <p className="text-xs text-muted-foreground">for TV shows</p>
            </CardContent>
          </Card>
        </div>

        {tvStats.completed === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20">
            <p className="text-center text-muted-foreground">
              No TV shows completed yet. Start watching to see your TV stats!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-4">
              <CompletedOverTimeChart data={tvStats.activityOverTime || completedOverTime} />
            </div>
            <div className="lg:col-span-3">
              <GenreDistributionChart data={tvStats.genreDistribution || genreDistribution} />
            </div>
          </div>
        )}
      </TabsContent>

      {/* Books Stats */}
      <TabsContent value="books" className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Books Finished</CardTitle>
              <BookMarked className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookStats.completed}</div>
              <p className="text-xs text-muted-foreground">books read</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pages Read</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookStats.pagesRead.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">total pages</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookStats.avgRating > 0 ? `${bookStats.avgRating}/5` : 'N/A'}</div>
              <p className="text-xs text-muted-foreground">for books</p>
            </CardContent>
          </Card>
          
        </div>

        {bookStats.completed === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20">
            <p className="text-center text-muted-foreground">
              No books finished yet. Start reading to see your book stats!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-4">
              <CompletedOverTimeChart data={bookStats.activityOverTime || completedOverTime} />
            </div>
            <div className="lg:col-span-3">
              <GenreDistributionChart data={bookStats.genreDistribution || genreDistribution} />
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
