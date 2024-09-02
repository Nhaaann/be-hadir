const monthNameToIndex: { [key: string]: number } = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};
export const indexToMonthName: { [key: number]: string } = Object.keys(
  monthNameToIndex,
).reduce((acc, key) => {
  acc[monthNameToIndex[key]] = key;
  return acc;
}, {} as { [key: number]: string });
export function getWeekNumberInMonth(date: Date): number {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const startDay = startOfMonth.getDay(); // Get the day of the week for the 1st of the month
  const offsetDate = date.getDate() + startDay - 1; // Adjust for days before the first full week

  return Math.ceil(offsetDate / 7); // Use ceil to ensure proper week calculation
}

export function getMonthRange(month: string): [Date, Date] {
  const year = new Date().getFullYear();
  const monthIndex = parseInt(month, 10) - 1; // Convert 'MM' to month index
  const startOfMonth = new Date(year, monthIndex, 1);
  const endOfMonth = new Date(year, monthIndex + 1, 0);
  return [startOfMonth, endOfMonth];
}

export function getWeekRange(month: string, week: number): [Date, Date] {
  const year = new Date().getFullYear();
  const monthIndex = parseInt(month, 10) - 1; // Convert 'MM' to month index
  const startOfMonth = new Date(year, monthIndex, 1);

  // Calculate the start of the week
  const startOfWeek = new Date(startOfMonth);
  startOfWeek.setDate((week - 1) * 7 + 1);

  // Calculate the end of the week
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  // Adjust endOfWeek if it goes beyond the last day of the month
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
  if (endOfWeek.getDate() > lastDayOfMonth) {
    endOfWeek.setDate(lastDayOfMonth);
  }

  return [startOfWeek, endOfWeek];
}

export function getMaxWeeksInMonth(month: string): number {
  const year = new Date().getFullYear();
  const monthIndex = parseInt(month, 10) - 1; // Convert 'MM' to month index
  const endOfMonth = new Date(year, monthIndex + 1, 0);
  const totalDays = endOfMonth.getDate();
  return Math.ceil(totalDays / 7);
}
