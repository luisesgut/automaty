import { formatNumber, formatNumberWithUnit, formatString, coerceBoolean } from '../formatters';

describe('formatters utilities', () => {
  it('formatNumber returns N/A for null and formatted value for numbers', () => {
    expect(formatNumber(null)).toBe('N/A');
    expect(formatNumber(1234)).toBe('1,234');
  });

  it('formatNumberWithUnit appends units only when value is numeric', () => {
    expect(formatNumberWithUnit(500, 'kg')).toBe('500 kg');
    expect(formatNumberWithUnit(null, 'kg')).toBe('N/A');
  });

  it('formatString trims values and falls back to N/A', () => {
    expect(formatString('  value  ')).toBe('value');
    expect(formatString('   ')).toBe('N/A');
    expect(formatString(null)).toBe('N/A');
  });

  it('coerceBoolean normalises truthy inputs', () => {
    expect(coerceBoolean(true)).toBe(true);
    expect(coerceBoolean(null)).toBe(false);
  });
});
