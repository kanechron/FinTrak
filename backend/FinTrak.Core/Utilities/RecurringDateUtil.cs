

namespace FinTrak.Core.Utilities
{
    
    public static class RecurringDateUtil
    {
        
        /// <summary>
        /// Calculates the next recurring end date for a budget based on its period and recurring date settings.
        /// </summary>
        /// <param name="startDate"></param>
        /// <param name="recurringDate"></param>
        /// <returns>DateOnly</returns>
        public static DateOnly GetRecurringDateMonth(DateOnly startDate, string recurringDate)
        {
            if (string.IsNullOrEmpty(recurringDate)) return startDate.AddMonths(1); // Default to same day next month if not specified

            var nextMonth = startDate.AddMonths(1);

            
            switch (recurringDate.ToLower())
            {
                case "first":
                    return new DateOnly(nextMonth.Year, nextMonth.Month, 1);
                case "last":
                    var lastDay = DateTime.DaysInMonth(startDate.Year, startDate.Month);
                    return new DateOnly(nextMonth.Year, startDate.Month, lastDay);
                default:
                    if (int.TryParse(recurringDate, out int day))
                    {
                        var daysInMonth = DateTime.DaysInMonth(nextMonth.Year, nextMonth.Month);
                        day = Math.Clamp(day, 1, daysInMonth);
                        return new DateOnly(nextMonth.Year, nextMonth.Month, day);
                    }
                    break;
            }

            return startDate; // Fallback to startDate if parsing fails
        }

        public static DateOnly GetRecurringDateYear(DateOnly startDate, string recurringDate)
        {
            if (string.IsNullOrEmpty(recurringDate)) return startDate.AddYears(1); // Default to same day next year if not specified

            var nextYear = startDate.AddYears(1);

            switch (recurringDate.ToLower())
            {
                case "first":
                    return new DateOnly(nextYear.Year, 1, 1);
                case "last":
                    return new DateOnly(startDate.Year, 12, 31); 
                default:
                    return new DateOnly(nextYear.Year, startDate.Month, startDate.Day); // Keep same month/day next year       
            }
        }

        public static DateOnly GetRecurringDateWeek(DateOnly startDate, string recurringDate)
        {
            if (string.IsNullOrEmpty(recurringDate)) return startDate.AddDays(7); // Default to same day next week if not specified

            var targetDay = recurringDate.ToLower() switch
            {
                "sunday" => DayOfWeek.Sunday,
                "monday" => DayOfWeek.Monday,
                "tuesday" => DayOfWeek.Tuesday,
                "wednesday" => DayOfWeek.Wednesday,
                "thursday" => DayOfWeek.Thursday,
                "friday" => DayOfWeek.Friday,
                "saturday" => DayOfWeek.Saturday,
                _ => startDate.DayOfWeek // Default to same day of week if parsing fails
            };

            var daysUntilTarget = ((int)targetDay - (int)startDate.DayOfWeek + 7) % 7;
            daysUntilTarget = daysUntilTarget == 0 ? 7 : daysUntilTarget;

            return startDate.AddDays(daysUntilTarget); // Return the calculated date
        }
    }
}