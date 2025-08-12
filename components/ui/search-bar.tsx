'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  handleKeyboardNavigation, 
  useScreenReader,
  focusManager 
} from '@/lib/accessibility';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'category' | 'recent' | 'popular';
  slug?: string;
  categorySlug?: string;
  image?: string;
  icon?: string;
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
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { announce } = useScreenReader();
  
  // Generate stable IDs for accessibility (SSR-safe)
  const reactId = useId();
  const searchInputId = `search-input-${reactId}`;
  const suggestionsId = `search-suggestions-${reactId}`;
  const statusId = `search-status-${reactId}`;

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('minimarket-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading recent searches:', error);
        }
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
    setSelectedIndex(-1);
    
    // Announce search action to screen readers
    announce(`Buscando ${searchTerm}`, 'polite');
    
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
    setSelectedIndex(-1);
  };

  // Popular searches and combined suggestions must be defined before usage
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

  // Enhanced keyboard navigation
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || allSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
          handleSuggestionClick(allSuggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Announce suggestion count when results change
  useEffect(() => {
    if (isOpen && query && allSuggestions.length > 0) {
      announce(`${allSuggestions.length} sugerencias disponibles`, 'polite');
    }
  }, [allSuggestions.length, isOpen, query, announce]);

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('minimarket-recent-searches');
  };

  const getSuggestionIcon = (suggestion: SearchSuggestion) => {
    switch (suggestion.type) {
      case 'recent':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'popular':
        return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
      case 'product':
        return suggestion.image ? (
          <div className="w-8 h-8 rounded bg-muted overflow-hidden flex-shrink-0">
            <img 
              src={suggestion.image} 
              alt={suggestion.text}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <span className="text-sm">📦</span>
        );
      case 'category':
        return suggestion.icon ? (
          <span className="text-lg">{suggestion.icon}</span>
        ) : (
          <span className="text-sm">🏷️</span>
        );
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Function to highlight matched text
  const highlightMatch = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className={cn('relative w-full max-w-lg', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            id={searchInputId}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleInputKeyDown}
            onFocus={() => setIsOpen(true)}
            onBlur={(e) => {
              // Delay closing to allow click on suggestions
              setTimeout(() => setIsOpen(false), 200);
            }}
            placeholder={placeholder}
            className="pl-10 pr-10 thumb-friendly typography-hierarchy"
            autoFocus={autoFocus}
            autoComplete="off"
            role="combobox"
            aria-expanded={isOpen}
            aria-owns={isOpen ? suggestionsId : undefined}
            aria-describedby={statusId}
            aria-activedescendant={
              selectedIndex >= 0 && allSuggestions[selectedIndex] 
                ? allSuggestions[selectedIndex].id 
                : undefined
            }
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 thumb-friendly"
              onClick={() => {
                setQuery('');
                setSelectedIndex(-1);
                setIsOpen(false);
                inputRef.current?.focus();
                announce('Campo de búsqueda limpiado', 'polite');
              }}
              aria-label="Limpiar búsqueda"
              title="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Limpiar</span>
            </Button>
          )}
        </div>
      </form>

      {/* Screen reader status region */}
      <div 
        id={statusId}
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {isOpen && allSuggestions.length > 0 && (
          `${allSuggestions.length} sugerencias disponibles. Use las flechas arriba y abajo para navegar.`
        )}
        {query && allSuggestions.length === 0 && (
          'No se encontraron sugerencias'
        )}
      </div>

      {/* Search Suggestions */}
      {isOpen && showSuggestions && allSuggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border">
          <CardContent className="p-0">
            <div 
              ref={suggestionsRef}
              id={suggestionsId}
              className="max-h-80 overflow-y-auto"
              role="listbox"
              aria-label="Sugerencias de búsqueda"
            >
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

              {allSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  id={suggestion.id}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors thumb-friendly",
                    selectedIndex === index && "bg-muted/75 outline-2 outline-ring"
                  )}
                  role="option"
                  aria-selected={selectedIndex === index}
                  onMouseDown={(e) => e.preventDefault()} // Prevent blur
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => handleSuggestionClick(suggestion)}
                  aria-label={`${suggestion.text}${
                    suggestion.type === 'product' ? ' - Producto' : 
                    suggestion.type === 'category' ? ' - Categoría' : 
                    suggestion.type === 'recent' ? ' - Búsqueda reciente' :
                    suggestion.type === 'popular' ? ' - Búsqueda popular' : ''
                  }`}
                >
                  {getSuggestionIcon(suggestion)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="typography-hierarchy flex-1 truncate">
                        {highlightMatch(suggestion.text, query)}
                      </span>
                      
                      {suggestion.type === 'popular' && (
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          Popular
                        </Badge>
                      )}
                      
                      {suggestion.type === 'category' && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          Categoría
                        </Badge>
                      )}
                    </div>
                    
                    {suggestion.type === 'product' && (
                      <p className="text-xs text-muted-foreground truncate">
                        Producto
                      </p>
                    )}
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
  useEffect(() => {
    if (isOpen) {
      // Capture focus when modal opens
      focusManager.captureFocus();
      
      // Set up focus trap
      const modal = document.querySelector('[role="dialog"]') as HTMLElement;
      if (modal) {
        const cleanup = focusManager.createFocusTrap(modal);
        return cleanup;
      }
    }
  }, [isOpen]);

  const handleClose = () => {
    focusManager.restoreFocus();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-background"
      role="dialog"
      aria-modal="true"
      aria-label="Búsqueda de productos"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="p-2 thumb-friendly"
            aria-label="Cerrar búsqueda"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Cerrar</span>
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
                  className="justify-start h-auto p-3 thumb-friendly"
                  onClick={() => {
                    handleClose();
                    // Navigate to category
                  }}
                  aria-label={`Buscar en categoría ${category}`}
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