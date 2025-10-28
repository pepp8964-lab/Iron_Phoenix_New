

import React, { useState, useMemo, useCallback, useEffect, createContext, useContext, KeyboardEvent, useRef } from 'react';
import { OrderItem, Person, DisciplinaryAction, Theme, AutocompletePreset } from './types';
import { DISCIPLINARY_ACTIONS, UI_LABELS } from './constants';
import { formatName, getReportPlural, getStatutePlural } from './utils';
import { OrderForm } from './components/OrderForm';
import { GeneratedOutput } from './components/GeneratedOutput';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Select } from './components/ui/Select';
import { Modal } from './components/ui/Card';
import { PlusIcon, DocumentTextIcon, PhoenixIcon, LockClosedIcon, ArrowUturnLeftIcon, Cog6ToothIcon, CircleStackIcon, TrashIcon, ArrowLeftIcon, ArrowRightIcon } from './components/icons';

// LocalStorage Hook
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// Theme Context
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useLocalStorage<Theme>('app-theme', 'dark-phoenix');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

// Data Context
interface DataContextType {
  autocompletePresets: AutocompletePreset[];
  setAutocompletePresets: (presets: AutocompletePreset[] | ((val: AutocompletePreset[]) => AutocompletePreset[])) => void;
}
const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [autocompletePresets, setAutocompletePresets] = useLocalStorage<AutocompletePreset[]>('autocomplete-presets', []);

  return (
    <DataContext.Provider value={{ autocompletePresets, setAutocompletePresets }}>
      {children}
    </DataContext.Provider>
  );
};
const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

// --- Sub-components ---

const HomePage = ({ onStartGenerator }: { onStartGenerator: () => void }) => {
    const appTiles = [
        {
            title: 'Генератор наказів',
            description: 'Створення наказів про стягнення.',
            icon: DocumentTextIcon,
            active: true,
            action: onStartGenerator,
        },
        ...Array(7).fill({
            title: 'Незабаром...',
            description: 'Інструмент в розробці.',
            icon: LockClosedIcon,
            active: false,
        }),
    ];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-primary to-secondary/80">
            <div className="w-full max-w-5xl">
                <header className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 mb-12 md:mb-16">
                    <PhoenixIcon className="w-32 h-32 md:w-40 md:h-40 text-brand drop-shadow-[0_0_15px_rgba(var(--color-brand)/0.5)]" />
                    <div>
                        <h1 className="text-5xl sm:text-6xl md:text-8xl font-extrabold text-text-primary tracking-tight text-shadow-glow-white text-center md:text-left">
                            IRON PHOENIX
                        </h1>
                        <p className="text-text-secondary text-lg mt-2 text-center md:text-left">Набір інструментів для сучасних військових</p>
                    </div>
                </header>

                <main className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {appTiles.map((tile, index) => {
                        const Icon = tile.icon;
                        return (
                            <div
                                key={index}
                                onClick={tile.action}
                                className={`
                                    group bg-secondary/80 border border-border/30 rounded-xl p-4 flex flex-col items-center justify-center text-center
                                    transition-all duration-300 transform-gpu
                                    ${tile.active
                                        ? 'cursor-pointer hover:bg-brand/20 hover:border-brand hover:shadow-glow-brand hover:-translate-y-1'
                                        : 'opacity-50 cursor-not-allowed'
                                    }
                                `}
                            >
                                <Icon className={`w-10 h-10 mb-3 ${tile.active ? 'text-brand' : 'text-accent'}`} />
                                <h3 className="font-bold text-text-primary text-sm sm:text-base">{tile.title}</h3>
                                <p className="text-text-secondary text-xs sm:text-sm">{tile.description}</p>
                            </div>
                        );
                    })}
                </main>
            </div>
        </div>
    );
};

const SettingsModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    const { theme, setTheme } = useTheme();
    const themes: { id: Theme; name: string; colors: string[] }[] = [
        { id: 'dark-phoenix', name: 'Темний Фенікс', colors: ['#0A0A0A', '#EF4444'] },
        { id: 'dark-default', name: 'Темний Океан', colors: ['#0A0A0A', '#3B82F6'] },
        { id: 'light-arctic', name: 'Світлий Арктичний', colors: ['#F9FAFB', '#2563EB'] },
        { id: 'light-solar', name: 'Світлий Сонячний', colors: ['#FEFCF0', '#D946EF'] },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Налаштування">
          <div className="space-y-4">
            <h3 className="text-md font-medium text-text-primary">Тема оформлення</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {themes.map(t => (
                <div key={t.id} onClick={() => setTheme(t.id)} className={`p-3 border rounded-lg cursor-pointer transition-all ${theme === t.id ? 'border-brand ring-2 ring-brand' : 'border-border hover:border-text-secondary'}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-1.5 border-2 border-secondary rounded-full">
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: t.colors[0] }}></div>
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: t.colors[1] }}></div>
                    </div>
                    <span className="text-sm font-medium text-text-primary">{t.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
    );
};

export const AutocompleteTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, value, ...props }) => {
  const { autocompletePresets } = useData();
  const [suggestion, setSuggestion] = useState('');

  useEffect(() => {
    const stringValue = String(value || '');
    // Якщо рядок порожній або закінчується роздільником, слово для завершення відсутнє.
    if (!stringValue.trim() || /[\s,;:]$/.test(stringValue)) {
      setSuggestion('');
      return;
    }

    // Розділяємо за поширеними роздільниками і беремо останню частину як слово, що вводиться.
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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      // @ts-ignore
      props.onChange?.({ target: { value: String(value || '') + suggestion } });
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
      <div className="relative">
        <textarea {...props} value={value} onKeyDown={handleKeyDown} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-text-primary placeholder-accent focus:outline-none focus:ring-2 focus:ring-brand caret-text-primary transition-colors duration-200" />
        {suggestion && (
          <div className="absolute inset-0 px-3 py-2 pointer-events-none overflow-hidden" style={{fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit'}}>
            <span className="invisible whitespace-pre-wrap">{value}</span>
            <span className="text-brand opacity-80 whitespace-pre-wrap animate-pulse">{suggestion}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const DataManagement: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { autocompletePresets, setAutocompletePresets } = useData();

    const addPreset = () => setAutocompletePresets(prev => [...prev, { id: Date.now().toString(), text: '' }]);
    const updatePreset = (id: string, text: string) => setAutocompletePresets(prev => prev.map(p => p.id === id ? { ...p, text } : p));
    const removePreset = (id: string) => setAutocompletePresets(prev => prev.filter(p => p.id !== id));

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8">
            <header className="flex justify-between items-center mb-10">
                <h1 className="text-2xl md:text-4xl font-bold text-text-primary text-shadow-glow-white">Керування даними</h1>
                <Button onClick={onBack} variant="ghost"><ArrowUturnLeftIcon className="w-5 h-5 mr-2" />Назад</Button>
            </header>
            <main>
                <div>
                    <h2 className="text-xl font-bold text-text-primary mb-2">Шаблони автозаповнення</h2>
                    <p className="text-text-secondary mb-6">Додайте фрази, які ви часто використовуєте. Система буде пропонувати їх для автозавершення по клавіші TAB під час вводу посад.</p>
                    <div className="space-y-3">
                        {autocompletePresets.map(preset => (
                            <div key={preset.id} className="flex gap-2">
                                <Input value={preset.text} onChange={e => updatePreset(preset.id, e.target.value)} label="" placeholder="напр. навчального взводу..." />
                                <Button onClick={() => removePreset(preset.id)} variant="danger" className="shrink-0"><TrashIcon className="w-5 h-5"/></Button>
                            </div>
                        ))}
                    </div>
                    <Button onClick={addPreset} variant="secondary" className="mt-4"><PlusIcon className="w-4 h-4 mr-2"/>Додати шаблон</Button>
                </div>
            </main>
        </div>
    );
};

const createNewOrderItem = (): OrderItem => ({
  id: Date.now().toString(),
  orderType: 'single',
  reportDate: '',
  reportNumber: '',
  reportAuthorPosition: '',
  disciplinaryAction: DisciplinaryAction.REPRIMAND,
  violatedStatutes: '11',
  persons: [{ id: Date.now().toString() + '-p', position: '', rank: '', name: '' }],
  reason: '',
});

const OrderGenerator = ({ onBack, onManageData }: { onBack: () => void, onManageData: () => void }) => {
  const [orders, setOrders] = useState<OrderItem[]>([createNewOrderItem()]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const currentOrder = orders[currentIndex];

  const updateOrder = useCallback((updatedOrder: OrderItem) => {
    setOrders(prev => prev.map((o, i) => i === currentIndex ? updatedOrder : o));
  }, [currentIndex]);

  const goToNext = () => setCurrentIndex(i => Math.min(i + 1, orders.length - 1));
  const goToPrev = () => setCurrentIndex(i => Math.max(i - 1, 0));
  
  const addOrder = () => {
    setOrders(prev => [...prev, createNewOrderItem()]);
    setCurrentIndex(orders.length);
  };

  const removeCurrentOrder = () => {
    if (orders.length <= 1) return;
    setOrders(prev => prev.filter((_, i) => i !== currentIndex));
    setCurrentIndex(prev => Math.max(0, Math.min(prev, orders.length - 2)));
  };

  const generateTextForItem = useCallback((item: OrderItem): string => {
    const actionDetails = DISCIPLINARY_ACTIONS.find(a => a.value === item.disciplinaryAction);
    const statutePoint = actionDetails?.statute || '';
    const actionName = actionDetails?.label.toUpperCase() || '';
    const statuteText = getStatutePlural(item.violatedStatutes);
    const reportText = getReportPlural(item.reportNumber);
    const baseIntro = `Відповідно до вимог пункту «${statutePoint}» статті 48 Дисциплінарного статуту Збройних Сил України за низьку виконавчу дисципліну, порушення вимог ${statuteText} ${item.violatedStatutes} Статуту внутрішньої служби Збройних Сил України та на підставі ${reportText} ${item.reportAuthorPosition} від ${item.reportDate} № ${item.reportNumber}`;

    if (item.orderType === 'single') {
        const person = item.persons[0] || { position: '', rank: '', name: '' };
        return `${baseIntro} ${person.position} ${person.rank} ${formatName(person.name)}, який ${item.reason}, притягнути до дисциплінарної відповідальності та накласти дисциплінарне стягнення «${actionName}»`;
    } else {
        const personsList = item.persons.map(p => `\t${p.position} ${p.rank} ${formatName(p.name)};`).join('\n');
        const reasonClause = `\tякі ${item.reason}`;
        return `${baseIntro} притягнути до дисциплінарної відповідальності та накласти дисциплінарне стягнення «${actionName}»:\n${personsList}\n${reasonClause}`;
    }
  }, []);

  const generatedText = useMemo(() => orders.map(generateTextForItem).join('\n\n'), [orders, generateTextForItem]);
  const handleCopyItem = useCallback((index: number) => navigator.clipboard.writeText(generateTextForItem(orders[index])), [orders, generateTextForItem]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
      <header className="flex justify-between items-center mb-10">
        <div>
            <h1 className="text-2xl md:text-4xl font-bold text-text-primary text-shadow-glow-white">{UI_LABELS.APP_TITLE}</h1>
            <p className="text-text-secondary text-sm mt-1">Керуйте пунктами наказу та зберігайте шаблони для швидкого заповнення.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={onBack} variant="ghost"><ArrowUturnLeftIcon className="w-5 h-5 sm:mr-2" /><span className="hidden sm:inline">На головну</span></Button>
            <Button onClick={onManageData} variant="ghost" title="Керування даними"><CircleStackIcon className="w-6 h-6"/></Button>
            <Button onClick={() => setSettingsOpen(true)} variant="ghost" title="Налаштування"><Cog6ToothIcon className="w-6 h-6"/></Button>
        </div>
      </header>
      
      <main className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="flex items-center justify-between bg-secondary p-2 rounded-lg border border-border">
            <div className="flex items-center gap-4">
              <Button onClick={goToPrev} disabled={currentIndex === 0} variant="secondary"><ArrowLeftIcon className="w-5 h-5" /></Button>
              <span className="font-bold text-text-primary tabular-nums">Пункт {currentIndex + 1} / {orders.length}</span>
              <Button onClick={goToNext} disabled={currentIndex === orders.length - 1} variant="secondary"><ArrowRightIcon className="w-5 h-5" /></Button>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={addOrder} variant="secondary"><PlusIcon className="w-5 h-5 sm:mr-2" /><span className="hidden sm:inline">Новий</span></Button>
                <Button onClick={removeCurrentOrder} variant="danger" disabled={orders.length <= 1}><TrashIcon className="w-5 h-5" /></Button>
            </div>
          </div>
          {currentOrder && <OrderForm key={currentOrder.id} order={currentOrder} onUpdate={updateOrder} isOnlyItem={orders.length === 1} />}
        </div>
        
        <div className="lg:col-span-2">
          <GeneratedOutput text={generatedText} onCopyItem={handleCopyItem} itemCount={orders.length} />
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
    const [view, setView] = useState<'home' | 'orderGenerator' | 'dataManagement'>('home');

    if (view === 'orderGenerator') {
        return <OrderGenerator onBack={() => setView('home')} onManageData={() => setView('dataManagement')} />;
    }
    
    if (view === 'dataManagement') {
        return <DataManagement onBack={() => setView('orderGenerator')} />;
    }

    return <HomePage onStartGenerator={() => setView('orderGenerator')} />;
};

export default App;