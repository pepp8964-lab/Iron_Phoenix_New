import React from 'react';
import { OrderItem, Person, DisciplinaryAction } from '../types';
import { DISCIPLINARY_ACTIONS, UI_LABELS } from '../constants';
import { getTodaysDate } from '../utils';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { TrashIcon, PlusIcon, CalendarDaysIcon } from './icons';
import { AutocompleteTextarea } from '../App';

interface OrderFormProps {
  order: OrderItem;
  onUpdate: (order: OrderItem) => void;
  isOnlyItem: boolean;
}

const Fieldset: React.FC<{ legend: string; children: React.ReactNode }> = ({ legend, children }) => (
  <fieldset className="border border-border/50 rounded-lg p-4 mt-6">
    <legend className="px-2 text-sm font-semibold text-brand">{legend}</legend>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      {children}
    </div>
  </fieldset>
);


export const OrderForm: React.FC<OrderFormProps> = ({ order, onUpdate }) => {
  
  const handleFieldChange = (field: keyof OrderItem, value: any) => {
    onUpdate({ ...order, [field]: value });
  };

  const handlePersonChange = (personId: string, field: keyof Person, value: string) => {
    const updatedPersons = order.persons.map(p => 
      p.id === personId ? { ...p, [field]: value } : p
    );
    onUpdate({ ...order, persons: updatedPersons });
  };

  const addPerson = () => {
    const newPerson: Person = { id: Date.now().toString(), position: '', rank: '', name: '' };
    onUpdate({ ...order, persons: [...order.persons, newPerson] });
  };

  const removePerson = (personId: string) => {
    const updatedPersons = order.persons.filter(p => p.id !== personId);
    onUpdate({ ...order, persons: updatedPersons });
  };

  const setOrderType = (type: 'single' | 'multiple') => {
    if (type === 'single' && order.persons.length > 1) {
      onUpdate({ ...order, orderType: type, persons: [order.persons[0]] });
    } else {
      onUpdate({ ...order, orderType: type });
    }
  }

  return (
    <Card>
      <div className="bg-primary p-2 rounded-lg inline-flex gap-2 mb-4">
        <Button variant={order.orderType === 'single' ? 'primary' : 'secondary'} onClick={() => setOrderType('single')}>Одна особа</Button>
        <Button variant={order.orderType === 'multiple' ? 'primary' : 'secondary'} onClick={() => setOrderType('multiple')}>Декілька осіб</Button>
      </div>

      <Fieldset legend="Інформація про рапорт(и)">
        <Input 
          label="Посада автора рапорту (в родовому відмінку)" 
          placeholder="начальника штабу – заступника начальника..." 
          value={order.reportAuthorPosition} 
          onChange={e => handleFieldChange('reportAuthorPosition', e.target.value)} 
          containerClassName="md:col-span-2" 
        />
        <Input 
          label="Дата рапорту" 
          type="text" placeholder="01.08.2025" 
          value={order.reportDate} 
          onChange={e => handleFieldChange('reportDate', e.target.value)}
          endAdornment={
            <Button variant="ghost" size="normal" onClick={() => handleFieldChange('reportDate', getTodaysDate())} title="Вставити сьогоднішню дату">
              <CalendarDaysIcon className="w-5 h-5"/>
            </Button>
          }
        />
        <Input 
          label="Номер рапорту(ів)" 
          type="text" 
          placeholder="18872" 
          value={order.reportNumber} 
          onChange={e => handleFieldChange('reportNumber', e.target.value)} 
          helperText="Декілька номерів вказуйте через кому"
        />
      </Fieldset>
      
      <Fieldset legend="Деталі порушення та стягнення">
        <Select label="Вид стягнення" value={order.disciplinaryAction} onChange={e => handleFieldChange('disciplinaryAction', e.target.value as DisciplinaryAction)}>
          {DISCIPLINARY_ACTIONS.map(action => (
            <option key={action.value} value={action.value}>{action.label}</option>
          ))}
        </Select>
        <Input 
          label="Порушені статті статуту" 
          placeholder="11, 16" 
          value={order.violatedStatutes} 
          onChange={e => handleFieldChange('violatedStatutes', e.target.value)}
          helperText="Декілька статей вказуйте через кому або пробіл"
        />
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Причина стягнення</label>
          <textarea
              value={order.reason}
              onChange={e => handleFieldChange('reason', e.target.value)}
              placeholder={order.orderType === 'single' ? 'напр. неналежно виконував свої службові обов’язки...' : 'напр. 04.08.2025 року несвоєчасно приступили до проведення занять...'}
              rows={3}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-text-primary placeholder-accent focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors duration-200"
          />
          <p className="text-xs text-accent mt-1.5">
              {order.orderType === 'single' ? "Буде вставлено після '..., який ...'" : "Буде вставлено після '..., які ...'"}
          </p>
        </div>
      </Fieldset>

      <Fieldset legend={order.orderType === 'single' ? 'Дані особи' : 'Список осіб'}>
        <div className="md:col-span-2 flex flex-col gap-3">
          {order.persons.map((person) => (
            <div key={person.id} className="grid grid-cols-1 md:grid-cols-8 gap-x-4 gap-y-2 p-3 border border-border/30 rounded-lg bg-primary/50">
                <div className="md:col-span-4">
                  <AutocompleteTextarea 
                      label="Посада (в родовому)" 
                      placeholder="інструктора відділення..." 
                      value={person.position} 
                      onChange={e => handlePersonChange(person.id, 'position', e.target.value)}
                      rows={4}
                  />
                </div>
                <Input containerClassName="md:col-span-1" label="Звання" placeholder="капітана" value={person.rank} onChange={e => handlePersonChange(person.id, 'rank', e.target.value)} />
                <Input containerClassName="md:col-span-2" label="Прізвище І. П." placeholder="ЄЛІСЄЄВ Євген Іванович" value={person.name} onChange={e => handlePersonChange(person.id, 'name', e.target.value)} />
                {order.orderType === 'multiple' && order.persons.length > 1 && (
                    <div className="flex items-end md:col-span-1">
                        <Button onClick={() => removePerson(person.id)} variant="danger" className="w-full h-[42px]"><TrashIcon className="w-5 h-5"/></Button>
                    </div>
                )}
            </div>
          ))}
          {order.orderType === 'multiple' && (
            <Button onClick={addPerson} variant="secondary" className="self-start mt-2"><PlusIcon className="w-4 h-4 mr-2" /> Додати особу</Button>
          )}
        </div>
      </Fieldset>
    </Card>
  );
};
