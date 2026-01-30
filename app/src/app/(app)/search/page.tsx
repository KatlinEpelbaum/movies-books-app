'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { searchMediaAction, discoverByGenreAction, discoverBooksBySubjectAction } from '@/app/actions';
import type { MediaItem, MediaType } from '@/lib/types';
import { MediaCard } from "@/components/media/media-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search as SearchIcon, LoaderCircle, X, Film, Tv, BookOpen, Sparkles, CalendarDays } from "lucide-react";

// Common genres that work across media types
const COMMON_GENRES = [
    'Romance', 'Comedy', 'Drama', 'Action', 'Adventure', 
    'Fantasy', 'Science Fiction', 'Horror', 'Mystery', 'Thriller',
    'Crime', 'Historical', 'Family', 'Animation'
];

// Movie/TV specific genres
const MOVIE_TV_GENRES = [
    'Documentary', 'War', 'Western', 'Music', 'Biography'
];

// Book specific genres  
const BOOK_GENRES = [
    'Fiction', 'Non-fiction', 'Young Adult', 'Children', 
    'Self-help', 'Biography', 'History', 'Poetry', 'Classics'
];

// Year range options for books
const YEAR_RANGES = [
    { label: 'Any year', value: 'any' },
    { label: '2020s', value: '2020-2029' },
    { label: '2010s', value: '2010-2019' },
    { label: '2000s', value: '2000-2009' },
    { label: '1990s', value: '1990-1999' },
    { label: '1980s', value: '1980-1989' },
    { label: 'Before 1980', value: '0-1979' },
];

const SEARCH_STORAGE_KEY = 'search-state';

export default function SearchPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    // Read initial state from URL params
    const initialQuery = searchParams.get('q') || '';
    const initialType = (searchParams.get('type') as MediaType | 'all') || 'all';
    const initialGenres = searchParams.get('genres')?.split(',').filter(Boolean) || [];
    const initialPage = parseInt(searchParams.get('page') || '1', 10);
    const initialYearRange = searchParams.get('year') || 'any';
    
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [mediaType, setMediaType] = useState<MediaType | 'all'>(initialType);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenres);
    const [isDiscoverMode, setIsDiscoverMode] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [yearRange, setYearRange] = useState(initialYearRange);
    const resultsRef = useRef<HTMLDivElement>(null);

    // Update URL with current state (without triggering navigation)
    const updateUrl = useCallback((newQuery: string, newType: MediaType | 'all', newGenres: string[], newPage: number, newYearRange: string = 'any') => {
        const params = new URLSearchParams();
        if (newQuery) params.set('q', newQuery);
        if (newType !== 'all') params.set('type', newType);
        if (newGenres.length > 0) params.set('genres', newGenres.join(','));
        if (newPage > 1) params.set('page', String(newPage));
        if (newYearRange !== 'any') params.set('year', newYearRange);
        
        const newUrl = params.toString() ? `/search?${params.toString()}` : '/search';
        window.history.replaceState(null, '', newUrl);
        
        // Also save to sessionStorage for scroll restoration
        sessionStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify({
            query: newQuery,
            type: newType,
            genres: newGenres,
            page: newPage,
            yearRange: newYearRange,
            scrollY: window.scrollY
        }));
    }, []);

    // Get available genres based on selected media type
    const availableGenres = useMemo(() => {
        if (mediaType === 'book') {
            return [...COMMON_GENRES.filter(g => !['Action', 'Animation'].includes(g)), ...BOOK_GENRES];
        }
        if (mediaType === 'movie' || mediaType === 'tv') {
            return [...COMMON_GENRES, ...MOVIE_TV_GENRES];
        }
        return COMMON_GENRES;
    }, [mediaType]);

    const performSearch = useCallback(async (searchQuery: string, currentMediaType: MediaType | 'all', page: number = 1, shouldUpdateUrl = true) => {
        if (!searchQuery) return;

        setLoading(true);
        setIsDiscoverMode(false);
        if (!searched) setSearched(true);
        setResults([]);
        const searchResults = await searchMediaAction(searchQuery, currentMediaType, page);
        setResults(searchResults.slice(0, 25));
        setCurrentPage(page);
        setLoading(false);
        
        if (shouldUpdateUrl) {
            updateUrl(searchQuery, currentMediaType, selectedGenres, page, yearRange);
        }
    }, [searched, selectedGenres, updateUrl, yearRange]);

    const performGenreDiscover = useCallback(async (genres: string[], currentMediaType: MediaType | 'all', page: number = 1, shouldUpdateUrl = true) => {
        if (genres.length === 0) return;

        setLoading(true);
        setIsDiscoverMode(true);
        if (!searched) setSearched(true);
        setResults([]);
        
        if (currentMediaType === 'book') {
            // Use OpenLibrary subjects API for books with year filtering
            const discoverResults = await discoverBooksBySubjectAction(genres, page, yearRange);
            setResults(discoverResults.slice(0, 25));
        } else {
            const discoverType = currentMediaType === 'all' ? 'all' : currentMediaType as 'movie' | 'tv';
            const discoverResults = await discoverByGenreAction(genres, discoverType, page);
            setResults(discoverResults.slice(0, 25));
        }
        
        setCurrentPage(page);
        setLoading(false);
        
        if (shouldUpdateUrl) {
            updateUrl('', currentMediaType, genres, page, yearRange);
        }
    }, [searched, updateUrl, yearRange]);

    // For discover mode (API filters), show all results. For search mode, filter client-side
    const filteredResults = useMemo(() => {
        let filtered = results;
        
        // In discover mode with books, API already filtered by year and genre
        if (isDiscoverMode && mediaType === 'book') return filtered;
        
        // In discover mode (movies/TV), API already filtered by genre
        if (isDiscoverMode) return filtered;
        
        // In search mode with no genre filter, show all
        if (selectedGenres.length === 0) return filtered;
        
        // In search mode with genre filter, filter client-side
        return filtered.filter(item => {
            if (!item.genres || item.genres.length === 0) return false;
            
            return selectedGenres.some(selectedGenre => 
                item.genres?.some(itemGenre => 
                    itemGenre.toLowerCase().includes(selectedGenre.toLowerCase()) ||
                    selectedGenre.toLowerCase().includes(itemGenre.toLowerCase())
                )
            );
        });
    }, [results, selectedGenres, isDiscoverMode, mediaType, yearRange]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        if (query) {
            performSearch(query, mediaType, 1);
        } else if (selectedGenres.length > 0) {
            performGenreDiscover(selectedGenres, mediaType, 1);
        }
    }

    // Initialize from URL params or restore previous state
    useEffect(() => {
        if (isInitialized) return;
        
        const hasUrlParams = initialQuery || initialGenres.length > 0;
        
        if (hasUrlParams) {
            // URL has params, use them
            if (initialQuery) {
                performSearch(initialQuery, initialType, initialPage, false);
            } else if (initialGenres.length > 0) {
                performGenreDiscover(initialGenres, initialType, initialPage, false);
            }
            
            // Restore scroll position after results load
            const savedState = sessionStorage.getItem(SEARCH_STORAGE_KEY);
            if (savedState) {
                const { scrollY } = JSON.parse(savedState);
                setTimeout(() => window.scrollTo(0, scrollY), 100);
            }
        }
        
        setIsInitialized(true);
    }, []);

    // Update URL when type changes and re-search
    const handleTypeChange = (newType: MediaType | 'all') => {
        setMediaType(newType);
        setCurrentPage(1);
        
        // Filter out genres not available in new type
        const newAvailableGenres = newType === 'book' 
            ? [...COMMON_GENRES.filter(g => !['Action', 'Animation'].includes(g)), ...BOOK_GENRES]
            : newType === 'movie' || newType === 'tv'
                ? [...COMMON_GENRES, ...MOVIE_TV_GENRES]
                : COMMON_GENRES;
        
        const filteredGenres = selectedGenres.filter(g => newAvailableGenres.includes(g));
        setSelectedGenres(filteredGenres);
        
        if (searched) {
            if (query) {
                performSearch(query, newType, 1);
            } else if (filteredGenres.length > 0) {
                performGenreDiscover(filteredGenres, newType, 1);
            }
        }
    };

    const toggleGenre = (genre: string) => {
        const newGenres = selectedGenres.includes(genre) 
            ? selectedGenres.filter(g => g !== genre)
            : [...selectedGenres, genre];
        
        setSelectedGenres(newGenres);
        
        if (!query && newGenres.length > 0) {
            performGenreDiscover(newGenres, mediaType, 1);
        } else if (query) {
            // Just update URL, client-side filtering handles display
            updateUrl(query, mediaType, newGenres, currentPage, yearRange);
        }
    };

    const handleYearChange = (newYear: string) => {
        setYearRange(newYear);
        updateUrl(query, mediaType, selectedGenres, currentPage, newYear);
    };

    const mediaTypeButtons = [
        { value: 'all' as const, label: 'All', icon: Sparkles },
        { value: 'movie' as const, label: 'Movies', icon: Film },
        { value: 'tv' as const, label: 'TV Shows', icon: Tv },
        { value: 'book' as const, label: 'Books', icon: BookOpen },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-headline text-3xl font-bold">Discover Media</h1>
                <p className="text-muted-foreground">
                    Search by title or browse by genre below.
                </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch}>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder="Search by title or select a genre..." 
                            className="pl-10 h-11" 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <Button type="submit" disabled={loading} className="h-11 px-6">
                        {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <SearchIcon className="mr-2 h-4 w-4" />} 
                        Search
                    </Button>
                </div>
            </form>

            {/* Filters Card */}
            <Card className="p-4 space-y-4">
                {/* Media Type Filter */}
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                    <div className="flex flex-wrap gap-2">
                        {mediaTypeButtons.map(({ value, label, icon: Icon }) => (
                            <Button
                                key={value}
                                type="button"
                                variant={mediaType === value ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleTypeChange(value)}
                                className="gap-2"
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Genre Filter */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground">Genres</h3>
                        {selectedGenres.length > 0 && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                    setSelectedGenres([]);
                                    updateUrl(query, mediaType, [], currentPage, yearRange);
                                }}
                                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                                Clear all
                            </Button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {availableGenres.map((genre) => (
                            <Badge
                                key={genre}
                                variant={selectedGenres.includes(genre) ? "default" : "secondary"}
                                className={`cursor-pointer transition-all hover:scale-105 ${
                                    selectedGenres.includes(genre) 
                                        ? 'bg-primary text-primary-foreground' 
                                        : 'hover:bg-secondary/80'
                                }`}
                                onClick={() => toggleGenre(genre)}
                            >
                                {genre}
                                {selectedGenres.includes(genre) && (
                                    <X className="ml-1 h-3 w-3" />
                                )}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Year Filter (Books only) */}
                {mediaType === 'book' && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            Year Published
                        </h3>
                        <Select value={yearRange} onValueChange={handleYearChange}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Select year range" />
                            </SelectTrigger>
                            <SelectContent>
                                {YEAR_RANGES.map((range) => (
                                    <SelectItem key={range.value} value={range.value}>
                                        {range.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Active Filters Summary */}
                {(selectedGenres.length > 0 || (mediaType === 'book' && yearRange !== 'any')) && (
                    <div className="pt-2 border-t text-sm text-muted-foreground">
                        Filtering by: {mediaType !== 'all' ? mediaTypeButtons.find(m => m.value === mediaType)?.label : 'All types'}
                        {selectedGenres.length > 0 && ` • ${selectedGenres.join(', ')}`}
                        {mediaType === 'book' && yearRange !== 'any' && ` • ${YEAR_RANGES.find(r => r.value === yearRange)?.label}`}
                    </div>
                )}
            </Card>

            {/* Results Section */}
            <section>
                {loading && (
                    <div className="flex justify-center py-12">
                        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                
                {!loading && searched && filteredResults.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground">
                        {mediaType === 'book' && yearRange !== 'any' && results.length > 0 ? (
                            <>
                                <p>No {selectedGenres.length > 0 ? selectedGenres.join(' + ') : 'books'} found from the {YEAR_RANGES.find(r => r.value === yearRange)?.label}.</p>
                                <Button 
                                    variant="link" 
                                    onClick={() => handleYearChange('any')}
                                    className="text-sm mt-2"
                                >
                                    Show all years ({results.length} books available)
                                </Button>
                            </>
                        ) : !isDiscoverMode && selectedGenres.length > 0 && results.length > 0 ? (
                            <>
                                <p>No results match your genre filters.</p>
                                <Button 
                                    variant="link" 
                                    onClick={() => setSelectedGenres([])}
                                    className="text-sm mt-2"
                                >
                                    Clear genre filters to see all {results.length} results
                                </Button>
                            </>
                        ) : (
                            <>
                                <p>No results found{query ? ` for "${query}"` : selectedGenres.length > 0 ? ` for ${selectedGenres.join(', ')}` : ''}.</p>
                                <p className="text-sm">Try a different search term or adjust your filters.</p>
                            </>
                        )}
                    </div>
                )}
                
                {!loading && filteredResults.length > 0 && (
                    <>
                        {!isDiscoverMode && selectedGenres.length > 0 && (
                            <p className="text-sm text-muted-foreground mb-4">
                                Showing {filteredResults.length} of {results.length} results
                            </p>
                        )}
                        {isDiscoverMode && (
                            <p className="text-sm text-muted-foreground mb-4">
                                Browsing {selectedGenres.join(' + ')} {mediaType !== 'all' ? mediaType + 's' : 'media'}
                            </p>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredResults.map((item) => (
                                <MediaCard key={item.id} media={item} />
                            ))}
                        </div>
                        {/* Pagination for both search and discover modes */}
                        <div className="mt-8 flex justify-center gap-2">
                            <Button
                                onClick={() => {
                                    if (isDiscoverMode) {
                                        performGenreDiscover(selectedGenres, mediaType, currentPage - 1);
                                    } else {
                                        performSearch(query, mediaType, currentPage - 1);
                                    }
                                }}
                                disabled={currentPage === 1 || loading}
                                variant="outline"
                            >
                                Previous
                            </Button>
                            <span className="flex items-center px-4 text-sm text-muted-foreground">
                                Page {currentPage}
                            </span>
                            <Button
                                onClick={() => {
                                    if (isDiscoverMode) {
                                        performGenreDiscover(selectedGenres, mediaType, currentPage + 1);
                                    } else {
                                        performSearch(query, mediaType, currentPage + 1);
                                    }
                                }}
                                disabled={results.length < 20 || loading}
                                variant="outline"
                            >
                                Next
                            </Button>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
