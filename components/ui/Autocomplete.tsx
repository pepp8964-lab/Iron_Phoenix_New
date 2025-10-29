import React, { useState, useEffect, KeyboardEvent, useMemo, useRef } from 'react';
import { useData } from '../../App';
import { Person, OrderItem, Theme } from '../../types';

interface Suggestion {
    text: string; // This will now hold the full completed string
    type: 'phrase' | 'word';
    originalWord?: string; // For words, what was the original suggestion before rebuilding the full text
}

const useAutocomplete = (
    value: string,
    onChange: (newValue: string) => void
) => {
    const { autocompletePresets, orders } = useData();
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

    const suggestionBank = useMemo(() => {
        const phrases = new Set<string>();
        const words = new Set<string>();

        const processText = (text: string) => {
            if (!text || typeof text !== 'string') return;
            const trimmedText = text.trim();
            if (trimmedText.length > 3) {
                phrases.add(trimmedText);
                trimmedText.split(/\s+/).forEach(word => {
                    if (word.length > 2) { 
                        words.add(word.toLowerCase());
                    }
                });
            }
        };

        autocompletePresets.forEach(p => processText(p.text));

        orders.forEach((order: OrderItem) => {
            processText(order.reportAuthorPosition);
            processText(order.reason);
            order.persons.forEach(p => {
                processText(p.position);
                processText(p.rank);
                processText(p.name);
            });
        });

        return { phrases: Array.from(phrases), words: Array.from(words) };
    }, [autocompletePresets, orders]);

    useEffect(() => {
        const stringValue = String(value || '').toLowerCase();
        
        if (!stringValue.trim() || stringValue.endsWith(' ')) {
            setShowSuggestions(false);
            setSuggestions([]);
            return;
        }

        const parts = stringValue.split(/\s+/);
        const currentWord = parts[parts.length - 1];

        const phraseMatches: Suggestion[] = suggestionBank.phrases
            .filter(suggestion =>
                suggestion.toLowerCase().startsWith(stringValue) &&
                suggestion.toLowerCase() !== stringValue
            ).map(text => ({ text, type: 'phrase' }));

        const wordMatches: Suggestion[] = suggestionBank.words
            .filter(suggestion =>
                suggestion.toLowerCase().startsWith(currentWord) &&
                suggestion.toLowerCase() !== currentWord
            ).map(text => ({ text: text, type: 'word', originalWord: text })); // Keep original word
        
        const combined = [...phraseMatches, ...wordMatches];
        
        // Rebuild the full text for display, but keep the original suggestion
        const uniqueSuggestions = Array.from(new Map(combined.map(s => [s.text.toLowerCase(), s])).values())
            .map(s => ({ ...s, text: s.type === 'phrase' ? s.text : (parts.slice(0, -1).join(' ') + ' ' + s.text).trim() }));


        const sortedSuggestions = uniqueSuggestions.sort((a, b) => {
            if (a.type === 'word' && b.type === 'phrase') return -1;
            if (a.type === 'phrase' && b.type === 'word') return 1;
            return a.text.length - b.text.length;
        });
        
        const filtered = sortedSuggestions.slice(0, 20);

        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
        
        if (activeSuggestionIndex >= filtered.length) {
          setActiveSuggestionIndex(0);
        }
    }, [value, suggestionBank, activeSuggestionIndex]);


    const applySuggestion = (suggestion: Suggestion, addSpace: boolean) => {
        // The `suggestion.text` already contains the full, corrected string for both phrases and words.
        // We can simply apply it directly.
        onChange(suggestion.text + (addSpace ? ' ' : ''));
        setShowSuggestions(false);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Tab') {
             if (suggestions[activeSuggestionIndex]) {
                e.preventDefault();
                applySuggestion(suggestions[activeSuggestionIndex], true);
            }
        } else if (e.key === 'Enter') {
            if (suggestions[activeSuggestionIndex]) {
                e.preventDefault();
                applySuggestion(suggestions[activeSuggestionIndex], false);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion: Suggestion) => {
        applySuggestion(suggestion, true);
    };

    return { suggestions, showSuggestions, activeSuggestionIndex, handleKeyDown, handleSuggestionClick, setShowSuggestions };
};


interface AutocompleteListProps {
    suggestions: Suggestion[];
    activeSuggestionIndex: number;
    onSuggestionClick: (suggestion: Suggestion) => void;
    theme: Theme;
}

const AutocompleteList: React.FC<AutocompleteListProps> = ({ suggestions, activeSuggestionIndex, onSuggestionClick, theme }) => {
    const listRef = useRef<HTMLUListElement>(null);
    const activeItemRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        if (activeItemRef.current) {
            activeItemRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest',
            });
        }
    }, [activeSuggestionIndex]);

    return (
        <ul
            ref={listRef}
            className="absolute bottom-full mb-2 w-full z-10 max-h-[260px] overflow-hidden py-4
                      [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"
        >
            {suggestions.map((suggestion, index) => {
                const distance = Math.abs(index - activeSuggestionIndex);
                const opacity = Math.max(0.1, 1 - distance * 0.25);
                const scale = Math.max(0.9, 1 - distance * 0.04);
                const isSelected = index === activeSuggestionIndex;

                return (
                    <li
                        ref={isSelected ? activeItemRef : null}
                        key={index}
                        onMouseDown={() => onSuggestionClick(suggestion)}
                        className={`px-3 py-1.5 text-lg font-semibold text-center cursor-pointer truncate text-text-primary transition-all duration-200 ease-out ${isSelected ? 'text-shadow-glow-themed' : ''}`}
                        style={{
                            opacity: opacity,
                            transform: `scale(${scale})`,
                        }}
                        title={suggestion.text}
                    >
                        {suggestion.text}
                    </li>
                );
            })}
        </ul>
    );
};


// --- Common props ---
type AutocompleteProps = {
  label: string;
  value: string;
  containerClassName?: string;
  theme: Theme;
};

// --- AutocompleteTextarea ---
type AutocompleteTextareaProps = AutocompleteProps & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> & {
    onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
};

export const AutocompleteTextarea: React.FC<AutocompleteTextareaProps> = ({ label, value, containerClassName, theme, onChange: originalOnChange, ...props }) => {
    const handleChange = (newValue: string) => {
        if (originalOnChange) {
            const event = { target: { value: newValue } } as React.ChangeEvent<HTMLTextAreaElement>;
            originalOnChange(event);
        }
    };
    
    const { suggestions, showSuggestions, activeSuggestionIndex, handleKeyDown, handleSuggestionClick, setShowSuggestions } = useAutocomplete(value, handleChange);

    return (
        <div className={`w-full ${containerClassName}`}>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
            <div className="relative">
                <textarea
                    {...props}
                    value={value}
                    onKeyDown={handleKeyDown}
                    onChange={originalOnChange}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    onFocus={() => { if (value && !value.endsWith(' ') && suggestions.length > 0) setShowSuggestions(true); }}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-text-primary placeholder-accent focus:outline-none focus:ring-2 focus:ring-brand caret-text-primary transition-colors duration-200"
                />
                 {showSuggestions && <AutocompleteList suggestions={suggestions} activeSuggestionIndex={activeSuggestionIndex} onSuggestionClick={handleSuggestionClick} theme={theme} />}
            </div>
        </div>
    );
};


// --- AutocompleteInput ---
type AutocompleteInputProps = AutocompleteProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
    onChange: React.ChangeEventHandler<HTMLInputElement>;
};

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ label, value, containerClassName, theme, onChange: originalOnChange, ...props }) => {
    const handleChange = (newValue: string) => {
        if (originalOnChange) {
            const event = { target: { value: newValue } } as React.ChangeEvent<HTMLInputElement>;
            originalOnChange(event);
        }
    };

    const { suggestions, showSuggestions, activeSuggestionIndex, handleKeyDown, handleSuggestionClick, setShowSuggestions } = useAutocomplete(value as string, handleChange);

    return (
        <div className={`w-full ${containerClassName}`}>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
            <div className="relative">
                <input
                    {...props}
                    value={value}
                    onKeyDown={handleKeyDown}
                    onChange={originalOnChange}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    onFocus={() => { if (value && !value.endsWith(' ') && suggestions.length > 0) setShowSuggestions(true); }}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-text-primary placeholder-accent focus:outline-none focus:ring-2 focus:ring-brand caret-text-primary transition-colors duration-200"
                />
                 {showSuggestions && <AutocompleteList suggestions={suggestions} activeSuggestionIndex={activeSuggestionIndex} onSuggestionClick={handleSuggestionClick} theme={theme} />}
            </div>
        </div>
    );
};