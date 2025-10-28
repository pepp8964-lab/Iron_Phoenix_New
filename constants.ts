import { DisciplinaryAction } from './types';

export const DISCIPLINARY_ACTIONS = [
  { value: DisciplinaryAction.REMARK, label: 'Зауваження', statute: 'а' },
  { value: DisciplinaryAction.REPRIMAND, label: 'Догана', statute: 'б' },
  { value: DisciplinaryAction.SEVERE_REPRIMAND, label: 'Сувора догана', statute: 'в' },
];

export const UI_LABELS = {
  APP_TITLE: 'Генератор наказів про стягнення',
  APP_SUBTITLE: 'Сучасний інструмент для швидкого та зручного формування пунктів наказу про накладення дисциплінарних стягнень.',
  WELCOME_TEXT: 'Вся інформація обробляється локально у вашому браузері та нікуди не передається. Ваші дані у безпеці.',
  START_BUTTON: 'Розпочати роботу',
  ADD_ORDER_ITEM: 'Додати пункт наказу',
  COPY_ALL: 'Скопіювати все',
  COPY_ITEM: 'Скопіювати пункт',
  COPIED: 'Скопійовано!',
  GENERATED_OUTPUT_TITLE: 'Згенерований результат',
  OUTPUT_PLACEHOLDER: 'Тут з\'явиться згенерований текст...',
  ORDER_ITEM_TITLE: 'Пункт наказу',
  REMOVE_ITEM: 'Видалити пункт',
};
