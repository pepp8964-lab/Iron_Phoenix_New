import React, { useState, useMemo, useCallback, useEffect, createContext, useContext, useRef } from 'react';
import { OrderItem, Person, DisciplinaryAction, Theme, AutocompletePreset, DriveData } from './types';
import { DISCIPLINARY_ACTIONS, UI_LABELS } from './constants';
import { formatName, getReportPlural, getStatutePlural, createNewOrderItem } from './utils';
import { OrderForm } from './components/OrderForm';
import { GeneratedOutput } from './components/GeneratedOutput';
import { Button } from './components/ui/Button';
import { Modal } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { AutocompleteInput } from './components/ui/Autocomplete';
import { PlusIcon, DocumentTextIcon, PhoenixIcon, LockClosedIcon, ArrowUturnLeftIcon, Cog6ToothIcon, CircleStackIcon, TrashIcon, ArrowLeftIcon, ArrowRightIcon, ArrowsUpDownIcon, CloudArrowUpIcon, CloudArrowDownIcon, ArrowPathIcon, GithubIcon } from './components/icons';

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
  orders: OrderItem[];
  setOrders: (orders: OrderItem[] | ((val: OrderItem[]) => OrderItem[])) => void;
}
const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [autocompletePresets, setAutocompletePresets] = useLocalStorage<AutocompletePreset[]>('autocomplete-presets', []);
  const [orders, setOrders] = useLocalStorage<OrderItem[]>('order-items', [createNewOrderItem()]);

  return (
    <DataContext.Provider value={{ autocompletePresets, setAutocompletePresets, orders, setOrders }}>
      {children}
    </DataContext.Provider>
  );
};
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

// --- Cloud Sync: GitHub Gist ---
const GIST_FILENAME = 'iron-phoenix-data.json';

interface GistConfig {
  gistId: string;
  githubToken: string;
}

interface GithubGistContextType {
  isConnected: boolean;
  connect: (gistId: string, token: string) => void;
  disconnect: () => void;
  saveDataToGist: (data: DriveData) => Promise<void>;
  loadDataFromGist: () => Promise<void>;
  status: string;
  lastSync: Date | null;
  config: GistConfig;
}

const GithubGistContext = createContext<GithubGistContextType | undefined>(undefined);

export const GithubGistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useLocalStorage<GistConfig>('gist-config', { gistId: '', githubToken: '' });
    const [status, setStatus] = useState('Не підключено');
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const { setOrders, setAutocompletePresets } = useData();
  
    const isConnected = useMemo(() => !!config.gistId && !!config.githubToken, [config]);
  
    const connect = (gistId: string, token: string) => {
      setConfig({ gistId, githubToken: token });
      setStatus('Підключено');
    };
  
    const disconnect = () => {
      setConfig({ gistId: '', githubToken: '' });
      setStatus('Не підключено');
      setLastSync(null);
    };

    const makeGistRequest = async (method: 'GET' | 'PATCH', body?: object) => {
        const url = `https://api.github.com/gists/${config.gistId}`;
        const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${config.githubToken}`
        };
        const options: RequestInit = { method, headers };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Помилка GitHub API: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }
        return response.json();
    }
  
    const saveDataToGist = useCallback(async (data: DriveData) => {
      if (!isConnected) return;
      setStatus('Синхронізація...');
      try {
        const body = {
          files: {
            [GIST_FILENAME]: {
              content: JSON.stringify(data, null, 2),
            },
          },
        };
        await makeGistRequest('PATCH', body);
        setStatus('Синхронізовано');
        setLastSync(new Date());
      } catch (e: any) {
        console.error("Error saving data to Gist:", e);
        setStatus(`Помилка збереження: ${e.message}`);
      }
    }, [isConnected, config]);
  
    const loadDataFromGist = useCallback(async () => {
      if (!isConnected) return;
      setStatus('Завантаження з хмари...');
      try {
        const gistData = await makeGistRequest('GET');
        const file = gistData.files?.[GIST_FILENAME];
        if (!file) {
            setStatus('Файл не знайдено у Gist. Збережіть, щоб створити.');
            return;
        }
        const data: DriveData = JSON.parse(file.content);
        if (data.orders) setOrders(data.orders);
        if (data.autocompletePresets) setAutocompletePresets(data.autocompletePresets);
        setStatus('Дані успішно завантажено.');
        setLastSync(new Date());
      } catch (e: any) {
        console.error("Error loading data from Gist:", e);
        setStatus(`Помилка завантаження: ${e.message}`);
      }
    }, [isConnected, config, setOrders, setAutocompletePresets]);
    
    const value = { isConnected, connect, disconnect, saveDataToGist, loadDataFromGist, status, lastSync, config };
  
    return <GithubGistContext.Provider value={value}>{children}</GithubGistContext.Provider>;
};
  
const useGithubGist = () => {
    const context = useContext(GithubGistContext);
    if (!context) throw new Error('useGithubGist must be used within a GithubGistProvider');
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
    const { orders, autocompletePresets } = useData();
    const { isConnected, connect, disconnect, status, lastSync, loadDataFromGist, saveDataToGist, config } = useGithubGist();
    
    const [localGistId, setLocalGistId] = useState(config.gistId);
    const [localToken, setLocalToken] = useState(config.githubToken);

    const themes: { id: Theme; name: string; colors: string[] }[] = [
        { id: 'dark-phoenix', name: 'Темний Фенікс', colors: ['#0A0A0A', '#EF4444'] },
        { id: 'dark-default', name: 'Темний Океан', colors: ['#0A0A0A', '#3B82F6'] },
        { id: 'light-arctic', name: 'Світлий Арктичний', colors: ['#F9FAFB', '#2563EB'] },
        { id: 'light-solar', name: 'Світлий Сонячний', colors: ['#FEFCF0', '#D946EF'] },
    ];
    
    const isSaving = status === 'Синхронізація...';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Налаштування">
          <div className="space-y-6">
            <fieldset className="border border-border/50 rounded-lg p-4">
              <legend className="px-2 text-sm font-semibold text-brand">Тема оформлення</legend>
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
            </fieldset>

            <fieldset className="border border-border/50 rounded-lg p-4">
                <legend className="px-2 text-sm font-semibold text-brand">Хмарна синхронізація (GitHub Gist)</legend>
                {!isConnected ? (
                     <div className="space-y-4">
                        <p className="text-xs text-text-secondary">Зберігайте дані у безкоштовному, секретному Gist на GitHub.</p>
                         <Input label="Gist ID" value={localGistId} onChange={e => setLocalGistId(e.target.value)} placeholder="ID вашого Gist" />
                         <Input label="Personal Access Token" type="password" value={localToken} onChange={e => setLocalToken(e.target.value)} placeholder="Токен з доступом до gist" />
                         <div className="text-xs text-text-secondary space-y-1">
                             <p>1. <a href="https://gist.github.com/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Створіть секретний Gist</a> та скопіюйте ID з URL.</p>
                             <p>2. <a href="https://github.com/settings/tokens/new?scopes=gist&description=Iron%20Phoenix%20Sync" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Створіть токен</a> з дозволом `gist`.</p>
                         </div>
                         <Button onClick={() => connect(localGistId, localToken)} disabled={!localGistId || !localToken}>
                             <GithubIcon className="w-5 h-5 mr-2" /> Підключити
                         </Button>
                     </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-text-secondary break-all">Gist ID: <span className="font-mono">{config.gistId}</span></p>
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                             <ArrowPathIcon className={`w-4 h-4 ${isSaving ? 'animate-spin-slow' : ''}`} />
                             <span>{status}</span>
                             {lastSync && !isSaving && <span>({lastSync.toLocaleTimeString()})</span>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button onClick={() => loadDataFromGist()}><CloudArrowDownIcon className="w-5 h-5 mr-2" />Завантажити</Button>
                            <Button onClick={() => saveDataToGist({ orders, autocompletePresets })}><CloudArrowUpIcon className="w-5 h-5 mr-2" />Зберегти зараз</Button>
                            <Button onClick={disconnect} variant="danger">Відключити</Button>
                        </div>
                    </div>
                )}
            </fieldset>
          </div>
        </Modal>
    );
};

const DataManagement: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { autocompletePresets, setAutocompletePresets } = useData();
    const { theme } = useTheme();

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
                                <AutocompleteInput value={preset.text} onChange={e => updatePreset(preset.id, e.target.value)} label="" placeholder="напр. навчального взводу..." theme={theme} />
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

interface OrderGeneratorProps {
    currentIndex: number;
    setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
    onBack: () => void;
    onManageData: () => void;
}

const OrderGenerator: React.FC<OrderGeneratorProps> = ({ currentIndex, setCurrentIndex, onBack, onManageData }) => {
  const { orders, setOrders, autocompletePresets } = useData();
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const { theme } = useTheme();
  
  const { saveDataToGist, isConnected } = useGithubGist();
  const autosaveTimeoutRef = useRef<number | null>(null);
  
  const currentOrder = orders[currentIndex];

  const updateOrder = useCallback((updatedOrder: OrderItem) => {
    setOrders(prev => prev.map((o, i) => i === currentIndex ? updatedOrder : o));
  }, [currentIndex, setOrders]);

  useEffect(() => {
    if (!isConnected) return;

    if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
    }
    autosaveTimeoutRef.current = window.setTimeout(() => {
        saveDataToGist({ orders, autocompletePresets });
    }, 3000); // 3-second debounce

    return () => {
        if (autosaveTimeoutRef.current) {
            clearTimeout(autosaveTimeoutRef.current);
        }
    };
  }, [orders, autocompletePresets, saveDataToGist, isConnected]);


  const goToNext = () => setCurrentIndex(i => Math.min(i + 1, orders.length - 1));
  const goToPrev = () => setCurrentIndex(i => Math.max(i - 1, 0));
  
  const addOrder = () => {
    const newOrder = createNewOrderItem();
    setOrders(prev => [...prev, newOrder]);
    setCurrentIndex(orders.length);
  };

  const removeCurrentOrder = () => {
    if (orders.length <= 1) return;
    const newOrders = orders.filter((_, i) => i !== currentIndex);
    setOrders(newOrders);
    setCurrentIndex(prev => Math.max(0, Math.min(prev, newOrders.length - 1)));
  };

  const sortOrders = () => {
    const actionOrder = DISCIPLINARY_ACTIONS.map(a => a.value);
    
    const sortedOrders = [...orders].sort((a, b) => {
        const indexA = actionOrder.indexOf(a.disciplinaryAction);
        const indexB = actionOrder.indexOf(b.disciplinaryAction);
        return indexA - indexB;
    });

    setOrders(sortedOrders);
    setCurrentIndex(0); // Reset to first item after sort
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
        const personDetails = `${person.position} ${person.rank} ${formatName(person.name)}`;
        const reasonClause = item.reason ? `, який ${item.reason},` : `,`;
        return `${baseIntro} ${personDetails}${reasonClause} притягнути до дисциплінарної відповідальності та накласти дисциплінарне стягнення «${actionName}»`;
    } else {
        const personsList = item.persons.map((p, index) => {
            const personDetails = `\t${p.position} ${p.rank} ${formatName(p.name)}`;
            const isLast = index === item.persons.length - 1;
            const terminator = (item.reason && isLast) ? ',' : ';';
            return `${personDetails}${terminator}`;
        }).join('\n');
        const reasonClause = item.reason ? `\n\tякі ${item.reason}` : '';
        return `${baseIntro} притягнути до дисциплінарної відповідальності та накласти дисциплінарне стягнення «${actionName}»:\n${personsList}${reasonClause}`;
    }
  }, []);

  const generatedText = useMemo(() => orders.map(generateTextForItem).join('\n\n\n'), [orders, generateTextForItem]);
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
                <Button onClick={sortOrders} variant="secondary" title="Сортувати за видом стягнення"><ArrowsUpDownIcon className="w-5 h-5" /></Button>
                <Button onClick={addOrder} variant="secondary"><PlusIcon className="w-5 h-5 sm:mr-2" /><span className="hidden sm:inline">Новий</span></Button>
                <Button onClick={removeCurrentOrder} variant="danger" disabled={orders.length <= 1}><TrashIcon className="w-5 h-5" /></Button>
            </div>
          </div>
          {currentOrder && <OrderForm key={currentOrder.id} order={currentOrder} onUpdate={updateOrder} isOnlyItem={orders.length === 1} theme={theme} />}
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
    
    // Index is local to the generator view
    const [currentIndex, setCurrentIndex] = useState(0);

    if (view === 'orderGenerator') {
        return <OrderGenerator 
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            onBack={() => setView('home')} 
            onManageData={() => setView('dataManagement')} 
        />;
    }
    
    if (view === 'dataManagement') {
        return <DataManagement onBack={() => setView('orderGenerator')} />;
    }

    return <HomePage onStartGenerator={() => setView('orderGenerator')} />;
};

export default App;
// Fix: Removed redundant export of GithubGistProvider.
// The component is already exported at its declaration, and re-exporting it caused a compilation error.
// export { GithubGistProvider };
