/**
 * IST Date & Time Formatting Utilities for Punjabi Bistro & Bakery
 */
export function formatISTDateTimePrecise(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export default formatISTDateTimePrecise;
