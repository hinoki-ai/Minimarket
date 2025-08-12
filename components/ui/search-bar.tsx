'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'category' | 'recent' | 'popular';
  slug?: string;
  categorySlug?: string;
}

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onSearch?: (query: string) => void;
  suggestions?: SearchSuggestion[];
  showSuggestions?: boolean;
}

export function SearchBar({ 
  placeholder = "Buscar productos, categorías...",
  className,
  autoFocus = false,
  onSearch,
  suggestions = [],
  showSuggestions = true
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('minimarket-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Save recent search
  const saveRecentSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    const updated = [
      searchTerm,
      ...recentSearches.filter(term => term !== searchTerm)
    ].slice(0, 5); // Keep only 5 recent searches
    
    setRecentSearches(updated);
    localStorage.setItem('minimarket-recent-searches', JSON.stringify(updated));
  };

  const handleSearch = (searchTerm: string = query) => {
    if (!searchTerm.trim()) return;
    
    saveRecentSearch(searchTerm);
    setIsOpen(false);
    
    if (onSearch) {
      onSearch(searchTerm);
    } else {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'product' && suggestion.slug) {
      router.push(`/products/${suggestion.slug}`);
    } else if (suggestion.type === 'category' && suggestion.categorySlug) {
      router.push(`/categories/${suggestion.categorySlug}`);
    } else {
      handleSearch(suggestion.text);
    }
    setIsOpen(false);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('minimarket-recent-searches');
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'popular':
        return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
      case 'product':
        return <span className="text-sm">📦</span>;
      case 'category':
        return <span className="text-sm">🏷️</span>;
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const popularSearches = [
    'Bebidas', 'Snacks', 'Pan fresco', 'Lácteos', 'Frutas', 'Verduras'
  ];

  // Combine all suggestions
  const allSuggestions = [
    ...recentSearches.map(term => ({
      id: `recent-${term}`,
      text: term,
      type: 'recent' as const
    })),
    ...suggestions.filter(s => 
      s.text.toLowerCase().includes(query.toLowerCase())
    ),
    ...(query.length === 0 ? popularSearches.map(term => ({
      id: `popular-${term}`,
      text: term,
      type: 'popular' as const
    })) : [])
  ].slice(0, 8); // Limit to 8 suggestions

  return (
    <div className={cn('relative w-full max-w-lg', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={(e) => {
              // Delay closing to allow click on suggestions
              setTimeout(() => setIsOpen(false), 200);
            }}
            placeholder={placeholder}
            className="pl-10 pr-10 thumb-friendly typography-hierarchy"
            autoFocus={autoFocus}
            autoComplete="off"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Search Suggestions */}
      {isOpen && showSuggestions && allSuggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border">
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              {/* Recent Searches Header */}
              {recentSearches.length > 0 && query.length === 0 && (
                <div className="flex items-center justify-between p-3 border-b">
                  <span className="text-sm font-medium text-muted-foreground">
                    Búsquedas recientes
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="h-auto p-1 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Limpiar
                  </Button>
                </div>
              )}

              {allSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors thumb-friendly"
                  onMouseDown={(e) => e.preventDefault()} // Prevent blur
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {getSuggestionIcon(suggestion.type)}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="typography-hierarchy">
                        {suggestion.text}
                      </span>
                      
                      {suggestion.type === 'popular' && (
                        <Badge variant="secondary" className="text-xs">
                          Popular
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              {/* No suggestions message */}
              {query.length > 0 && allSuggestions.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  <p className="typography-hierarchy">
                    No se encontraron sugerencias para "{query}"
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => handleSearch()}
                  >
                    Buscar de todas formas
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Compact version for mobile header
interface SearchBarCompactProps {
  onFocus?: () => void;
  className?: string;
}

export function SearchBarCompact({ onFocus, className }: SearchBarCompactProps) {
  return (
    <button
      className={cn(
        'flex items-center gap-3 w-full p-3 bg-muted/50 rounded-lg text-left thumb-friendly',
        'hover:bg-muted transition-colors',
        className
      )}
      onClick={onFocus}
    >
      <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="text-muted-foreground typography-hierarchy">
        Buscar productos...
      </span>
    </button>
  );
}

// Full-screen search modal for mobile
interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions?: SearchSuggestion[];
}

export function SearchModal({ isOpen, onClose, suggestions }: SearchModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <SearchBar
            autoFocus
            showSuggestions
            suggestions={suggestions}
            className="flex-1"
            placeholder="¿Qué estás buscando?"
          />
        </div>

        {/* Popular categories or recent searches can go here */}
        <div className="flex-1 p-4">
          <div className="space-y-4">
            <h3 className="font-medium">Categorías populares</h3>
            <div className="grid grid-cols-2 gap-2">
              {['Bebidas', 'Snacks', 'Lácteos', 'Pan fresco', 'Frutas', 'Verduras'].map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  className="justify-start h-auto p-3"
                  onClick={() => {
                    onClose();
                    // Navigate to category
                  }}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}