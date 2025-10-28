
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
