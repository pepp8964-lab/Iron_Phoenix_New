/**
 * Formats a full name string according to the rule: LASTNAME FirstName Patronymic.
 * @param fullName The full name to format.
 * @returns The formatted name.
 */
export const formatName = (fullName: string): string => {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return '';

  const lastName = parts[0].toUpperCase();
  const givenNames = parts.slice(1).map(name => 
    name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
  ).join(' ');

  return `${lastName} ${givenNames}`.trim();
};

/**
 * Returns today's date in dd.mm.yyyy format.
 * @returns A string representing today's date.
 */
export const getTodaysDate = (): string => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  return `${day}.${month}.${year}`;
};


/**
 * Determines the correct plural form for "стаття" based on the input string.
 * @param statuteString A string containing statute numbers, separated by spaces or commas.
 * @returns 'статей' if more than one statute, otherwise 'статті'.
 */
export const getStatutePlural = (statuteString: string): string => {
    const count = statuteString.split(/[\s,]+/).filter(Boolean).length;
    return count > 1 ? 'статей' : 'статті';
};

/**
 * Determines the correct plural form for "рапорт" based on the input string.
 * @param reportNumberString A string containing report numbers, separated by commas.
 * @returns 'рапортів' if more than one report, otherwise 'рапорту'.
 */
export const getReportPlural = (reportNumberString: string): string => {
    const count = reportNumberString.split(',').filter(Boolean).length;
    return count > 1 ? 'рапортів' : 'рапорту';
};
