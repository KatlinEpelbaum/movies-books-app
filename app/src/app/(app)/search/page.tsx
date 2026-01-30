'use client'

import { useState, useEffect, useCallback } from 'react';
import { searchMediaAction } from '@/app/actions';
import type { MediaItem, MediaType } from '@/lib/types';
import { MediaCard } from "@/components/media/media-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Search as SearchIcon, LoaderCircle } from "lucide-react";

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [mediaType, setMediaType] = useState<MediaType | 'all'>('all');
    const [currentPage, setCurrentPage] = useState(1);

    const performSearch = useCallback(async (currentQuery: string, currentMediaType: MediaType | 'all', page: number = 1) => {
        if (!currentQuery) return;

        setLoading(true);
        if (!searched) setSearched(true);
        setResults([]);
        const searchResults = await searchMediaAction(currentQuery, currentMediaType, page);
        // Limit to 25 items per page (5x5 grid)
        setResults(searchResults.slice(0, 25));
        setCurrentPage(page);
        setLoading(false);
    }, [searched]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        performSearch(query, mediaType, 1);
    }

    useEffect(() => {
        if (searched && query) {
            performSearch(query, mediaType, 1);
        }
    }, [mediaType]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-headline text-3xl font-bold">Discover Media</h1>
                <p className="text-muted-foreground">
                    Find your next favorite book, movie, or show.
                </p>
            </div>
            <form onSubmit={handleSearch} className="flex flex-col gap-4">
                 <div className="flex flex-col gap-4 md:flex-row">
                     <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder="Search for books, movies, TV shows..." 
                            className="pl-10" 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <Button type="submit" disabled={loading} className="md:w-32">
                        {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <SearchIcon className="mr-2 h-4 w-4" />} 
                        Search
                    </Button>
                </div>
                 <RadioGroup
                    value={mediaType}
                    onValueChange={(value: MediaType | 'all') => setMediaType(value)}
                    className="flex flex-wrap items-center gap-x-6 gap-y-2"
                >
                    <Label className="font-medium">Filter by:</Label>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="r-all" />
                        <Label htmlFor="r-all" className="font-normal cursor-pointer">All</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="movie" id="r-movie" />
                        <Label htmlFor="r-movie" className="font-normal cursor-pointer">Movies</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="tv" id="r-tv" />
                        <Label htmlFor="r-tv" className="font-normal cursor-pointer">TV Shows</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="book" id="r-book" />
                        <Label htmlFor="r-book" className="font-normal cursor-pointer">Books</Label>
                    </div>
                </RadioGroup>
            </form>

            <section>
                {loading && (
                    <div className="flex justify-center py-12">
                        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                {!loading && searched && results.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground">
                        <p>No results found for &quot;{query}&quot;.</p>
                        <p className="text-sm">Please try a different search term.</p>
                    </div>
                )}
                {!loading && results.length > 0 && (
                    <>
                        <div className="grid grid-cols-5 gap-4">
                            {results.map((item) => (
                                <MediaCard key={item.id} media={item} />
                            ))}
                        </div>
                        <div className="mt-8 flex justify-center gap-2">
                            <Button
                                onClick={() => performSearch(query, mediaType, currentPage - 1)}
                                disabled={currentPage === 1 || loading}
                                variant="outline"
                            >
                                Previous
                            </Button>
                            <span className="flex items-center px-4 text-sm text-muted-foreground">
                                Page {currentPage}
                            </span>
                            <Button
                                onClick={() => performSearch(query, mediaType, currentPage + 1)}
                                disabled={results.length < 25 || loading}
                                variant="outline"
                            >
                                Next
                            </Button>
                        </div>
                    </>
                )}
            </section>
        </div>
    )
}
