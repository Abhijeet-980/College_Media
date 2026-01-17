import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useDebounce } from '../hooks/useDebounce';
import { searchApi } from '../api/endpoints';
import { addToSearchHistory, getSearchHistory } from '../utils/searchHistory';
import SearchSuggestions from './SearchSuggestions';
import useVoiceSearch from '../hooks/useVoiceSearch';
import AdvancedSearchFilters from './AdvancedSearchFilters';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<any>({});

  const debouncedQuery = useDebounce(query, 400);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    isListening,
    transcript,
    error: voiceError,
    isSupported,
    startListening,
    stopListening
  } = useVoiceSearch({
    onResult: (text: string) => {
      setQuery(text);
      setIsOpen(true);
    },
    onEnd: () => {
      if (transcript.trim()) {
        handleSearch(transcript);
      }
    }
  });

  useEffect(() => {
    if (voiceError) {
      toast.error(voiceError);
    }
  }, [voiceError]);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      fetchSuggestions(debouncedQuery);
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  const fetchSuggestions = async (searchQuery: string) => {
    setLoading(true);
    try {
      const results = await searchApi.getSuggestions(searchQuery);
      setSuggestions(results.data || results);
    } catch (error) {
      console.error('Search failed:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    addToSearchHistory(searchQuery);

    const params = new URLSearchParams({
      q: searchQuery,
      sortBy: filters.sortBy || 'relevance',
      contentType: filters.contentType !== 'all' ? filters.contentType : undefined,
      dateRange: filters.dateRange !== 'all' ? filters.dateRange : undefined
    });

    // @ts-ignore
    const filteredParams = new URLSearchParams();
    params.forEach((value, key) => {
      if (value !== 'undefined' && value !== '') {
        filteredParams.append(key, value);
      }
    });

    navigate(`/search?${filteredParams.toString()}`);
    setIsOpen(false);
    setQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    searchRef.current?.querySelector('input')?.focus();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.querySelector('input')?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Icon
            icon="mdi:magnify"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-text-muted"
            width={20}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={t('common.searchPlaceholder') + " (Ctrl+K)"}
            className="w-full pl-10 pr-24 py-2.5 rounded-full border border-border bg-bg-secondary text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
            aria-label={t('common.search')}
            autoComplete="off"
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isSupported && (
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`p-1.5 rounded-full transition-colors ${isListening
                  ? 'bg-status-error/10 text-status-error animate-pulse'
                  : 'text-text-muted hover:text-brand-primary hover:bg-bg-tertiary'
                  }`}
                aria-label={isListening ? t('common.stopVoiceSearch') : t('common.voiceSearch')}
                title={isListening ? t('common.listening') : t('common.voiceSearch')}
              >
                <Icon
                  icon={isListening ? 'mdi:microphone' : 'mdi:microphone-outline'}
                  width={20}
                />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-full transition-colors ${showFilters
                ? 'bg-brand-primary/10 text-brand-primary'
                : 'text-text-muted hover:text-brand-primary hover:bg-bg-tertiary'
                }`}
              aria-label={t('common.advancedFilters')}
              title={t('common.advancedFilters')}
            >
              <Icon icon="mdi:filter-variant" width={20} />
            </button>

            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                aria-label={t('common.clearSearch')}
              >
                <Icon icon="mdi:close" width={20} />
              </button>
            )}
          </div>
        </div>
      </form>

      {showFilters && (
        <AdvancedSearchFilters
          onFilterChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {isOpen && (query || suggestions.length > 0 || getSearchHistory().length > 0) && (
        <SearchSuggestions
          suggestions={suggestions}
          loading={loading}
          query={query}
          history={getSearchHistory()}
          onSelect={handleSearch}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default SearchBar;

