import React, { useState, useEffect, KeyboardEvent } from 'react';
import { useData } from '../../App'; // Assuming useData is exported from App

type AutocompleteProps = {
  label: string;
  value: string;
  containerClassName?: string;
};

const useAutocomplete = (value: string) => {
    const { autocompletePresets } = useData();
    const [suggestion, setSuggestion] = useState('');

    useEffect(() => {
        const stringValue = String(value || '');
        if (!stringValue.trim() || /[\s,;:]$/.test(stringValue)) {
            setSuggestion('');
            return;
        }

        const parts = stringValue.split(/[\s,;:]+/);
        const lastPart = parts.pop() || '';

        if (!lastPart) {
            setSuggestion('');
            return;
        }

        const foundPreset = autocompletePresets.find(p =>
            p.text.toLowerCase().startsWith(lastPart.toLowerCase()) &&
            p.text.toLowerCase() !== lastPart.toLowerCase()
        );

        if (foundPreset) {
            const suggestionText = foundPreset.text.substring(lastPart.length);
            setSuggestion(suggestionText);
        } else {
            setSuggestion('');
        }
    }, [value, autocompletePresets]);

    return suggestion;
};

// --- AutocompleteTextarea ---
type AutocompleteTextareaProps = AutocompleteProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const AutocompleteTextarea: React.FC<AutocompleteTextareaProps> = ({ label, value, containerClassName, ...props }) => {
    const suggestion = useAutocomplete(value as string);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab' && suggestion) {
            e.preventDefault();
            // @ts-ignore
            props.onChange?.({ target: { value: String(value || '') + suggestion } });
        }
    };

    return (
        <div className={containerClassName}>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
            <div className="relative">
                <textarea
                    {...props}
                    value={value}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-text-primary placeholder-accent focus:outline-none focus:ring-2 focus:ring-brand caret-text-primary transition-colors duration-200"
                />
                {suggestion && (
                    <div className="absolute inset-0 px-3 py-2 pointer-events-none overflow-hidden" style={{ fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}>
                        <span className="invisible whitespace-pre-wrap">{value}</span>
                        <span className="text-brand opacity-80 whitespace-pre-wrap animate-pulse">{suggestion}</span>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- AutocompleteInput ---
type AutocompleteInputProps = AutocompleteProps & React.InputHTMLAttributes<HTMLInputElement>;

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ label, value, containerClassName, ...props }) => {
    const suggestion = useAutocomplete(value as string);
     
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Tab' && suggestion) {
            e.preventDefault();
             // @ts-ignore
            props.onChange?.({ target: { value: String(value || '') + suggestion } });
        }
    };

    return (
        <div className={containerClassName}>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
            <div className="relative">
                <input
                    {...props}
                    value={value}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-text-primary placeholder-accent focus:outline-none focus:ring-2 focus:ring-brand caret-text-primary transition-colors duration-200"
                />
                {suggestion && (
                    <div className="absolute inset-y-0 left-0 px-3 flex items-center pointer-events-none">
                        <span className="invisible">{value}</span>
                        <span className="text-brand opacity-80 animate-pulse">{suggestion}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
