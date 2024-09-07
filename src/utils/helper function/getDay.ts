function timeStringToDate(timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
  );
}

// Helper function to check if current time is between startTime and endTime
export function isCurrentTimeBetween(
  startTime: string,
  endTime: string,
): boolean {
  const now = new Date();
  const start = timeStringToDate(startTime);
  const end = timeStringToDate(endTime);
  return now >= start && now <= end;
}

// Helper function to get today's day name (assuming your `hari` entity has names like 'Sunday', 'Monday', etc.)
export function getTodayDayName(): string {
  const daysOfWeek = [
    'Minggu',
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
  ];
  const today = new Date();
  const dayIndex = today.getDay();
  return daysOfWeek[dayIndex];
}
