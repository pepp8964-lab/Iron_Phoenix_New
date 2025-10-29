
export enum DisciplinaryAction {
  REMARK = 'зауваження',
  REPRIMAND = 'догана',
  SEVERE_REPRIMAND = 'сувора догана',
}

export interface Person {
  id: string;
  position: string;
  rank: string;
  name: string;
}

export interface OrderItem {
  id: string;
  orderType: 'single' | 'multiple';
  reportDate: string;
  reportNumber: string;
  reportAuthorPosition: string;
  disciplinaryAction: DisciplinaryAction;
  violatedStatutes: string;
  persons: Person[];
  reason: string;
}

export type Theme = 'dark-default' | 'dark-phoenix' | 'light-arctic' | 'light-solar';

export interface AutocompletePreset {
    id: string;
    text: string;
}

export interface DriveData {
    orders: OrderItem[];
    autocompletePresets: AutocompletePreset[];
}