import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { OrderItem, Person, DisciplinaryAction } from './types';
import { DISCIPLINARY_ACTIONS, UI_LABELS } from './constants';
import { formatName, getReportPlural, getStatutePlural } from './utils';
import { OrderForm } from './components/OrderForm';
import { GeneratedOutput } from './components/GeneratedOutput';
import { Button } from './components/ui/Button';
import { PlusIcon, DocumentTextIcon, PhoenixIcon, LockClosedIcon, ArrowUturnLeftIcon } from './components/icons';

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
                    <PhoenixIcon className="w-32 h-32 md:w-40 md:h-40 text-brand drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                    <div className="relative">
                        <h1 className="text-5xl sm:text-6xl md:text-8xl font-extrabold text-white tracking-tight text-shadow-glow-white text-center md:text-left">
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
                                    group bg-secondary/80 border border-accent/30 rounded-xl p-4 flex flex-col items-center justify-center text-center
                                    transition-all duration-300 transform-gpu
                                    ${tile.active
                                        ? 'cursor-pointer hover:bg-brand/20 hover:border-brand hover:shadow-glow-brand hover:-translate-y-1'
                                        : 'opacity-50 cursor-not-allowed'
                                    }
                                `}
                            >
                                <Icon className={`w-10 h-10 mb-3 ${tile.active ? 'text-brand' : 'text-accent'}`} />
                                <h3 className="font-bold text-highlight text-sm sm:text-base">{tile.title}</h3>
                                <p className="text-text-secondary text-xs sm:text-sm">{tile.description}</p>
                            </div>
                        );
                    })}
                </main>
            </div>
        </div>
    );
};


const OrderGenerator = ({ onBack }: { onBack: () => void }) => {
  const [orders, setOrders] = useState<OrderItem[]>([]);

  useEffect(() => {
      // Initialize with one order item when component mounts
      if (orders.length === 0) {
          setOrders([createNewOrderItem()]);
      }
  }, []);

  const addOrder = () => {
    setOrders(prevOrders => [...prevOrders, createNewOrderItem()]);
  };

  const updateOrder = useCallback((updatedOrder: OrderItem) => {
    setOrders(prevOrders => prevOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  }, []);

  const removeOrder = useCallback((orderId: string) => {
    setOrders(prevOrders => prevOrders.filter(o => o.id !== orderId));
  }, []);

  const generateTextForItem = useCallback((item: OrderItem, index: number): string => {
    const itemNumber = index + 1;
    const actionDetails = DISCIPLINARY_ACTIONS.find(a => a.value === item.disciplinaryAction);
    const statutePoint = actionDetails?.statute || '';
    const actionName = actionDetails?.label.toUpperCase() || '';

    const statuteText = getStatutePlural(item.violatedStatutes);
    const reportText = getReportPlural(item.reportNumber);
    
    const baseIntro = `${itemNumber}.\tВідповідно до вимог пункту «${statutePoint}» статті 48 Дисциплінарного статуту Збройних Сил України за низьку виконавчу дисципліну, порушення вимог ${statuteText} ${item.violatedStatutes} Статуту внутрішньої служби Збройних Сил України та на підставі ${reportText} ${item.reportAuthorPosition} від ${item.reportDate} № ${item.reportNumber}`;

    if (item.orderType === 'single') {
        const person = item.persons[0] || { position: '', rank: '', name: '' };
        return `${baseIntro} ${person.position} ${person.rank} ${formatName(person.name)}, який ${item.reason}, притягнути до дисциплінарної відповідальності та накласти дисциплінарне стягнення «${actionName}»`;
    } else {
        const personsList = item.persons.map(p => `\t${p.position} ${p.rank} ${formatName(p.name)};`).join('\n');
        const reasonClause = `\tякі ${item.reason}`;
        return `${baseIntro} притягнути до дисциплінарної відповідальності та накласти дисциплінарне стягнення «${actionName}»:\n${personsList}\n${reasonClause}`;
    }
  }, []);

  const generatedText = useMemo(() => {
    return orders.map((order, index) => generateTextForItem(order, index)).join('\n\n');
  }, [orders, generateTextForItem]);
  
  const handleCopyItem = useCallback((index: number) => {
      const itemText = generateTextForItem(orders[index], index);
      navigator.clipboard.writeText(itemText);
  }, [orders, generateTextForItem]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-2xl md:text-4xl font-bold text-highlight text-shadow-glow-white">{UI_LABELS.APP_TITLE}</h1>
        <Button onClick={onBack} variant="ghost"> 
            <ArrowUturnLeftIcon className="w-5 h-5 mr-2" />
            На головну
        </Button>
      </header>
      
      <main className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3 flex flex-col gap-8">
          {orders.map((order, index) => (
            <OrderForm 
              key={order.id} 
              order={order} 
              onUpdate={updateOrder} 
              onRemove={() => removeOrder(order.id)}
              index={index} 
            />
          ))}
          <Button onClick={addOrder} variant="secondary" size="large" className="w-full">
            <PlusIcon className="w-5 h-5 mr-2" />
            {UI_LABELS.ADD_ORDER_ITEM}
          </Button>
        </div>
        
        <div className="lg:col-span-2">
          <GeneratedOutput text={generatedText} onCopyItem={handleCopyItem} itemCount={orders.length} />
        </div>
      </main>
    </div>
  );
};


const App: React.FC = () => {
    const [view, setView] = useState<'home' | 'orderGenerator'>('home');

    if (view === 'orderGenerator') {
        return <OrderGenerator onBack={() => setView('home')} />;
    }

    return <HomePage onStartGenerator={() => setView('orderGenerator')} />;
};

export default App;
