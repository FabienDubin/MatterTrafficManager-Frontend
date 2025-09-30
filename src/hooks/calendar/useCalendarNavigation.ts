import { useCallback } from 'react';
import { addDays } from 'date-fns';

/**
 * Hook for handling calendar navigation
 */
export const useCalendarNavigation = (
  currentView: any,
  currentDate: Date,
  setCurrentView: (view: any) => void,
  setCurrentDate: (date: Date) => void,
  calendarRef: any,
  setVisiblePeriod: (period: any) => void,
  loadedRanges: any[],
  fetchAdditionalRange: (start: Date, end: Date) => void
) => {
  // Handle view change
  const handleViewChange = (view: any) => {
    setCurrentView(view);

    // Update FullCalendar view if needed AND go to current date
    if (view !== 'day' && calendarRef.current) {
      const fcView = view === 'week' ? 'timeGridWeek' : 'dayGridMonth';
      const api = calendarRef.current.getApi();
      
      // Use changeView with date parameter for atomic update
      // This ensures the view and date change together
      api.changeView(fcView, currentDate);
    }
  };

  // Handle date navigation
  const handleDateNavigate = (direction: 'prev' | 'next' | 'today') => {
    let newDate = currentDate;

    if (direction === 'today') {
      newDate = new Date();
    } else {
      const increment = direction === 'next' ? 1 : -1;

      switch (currentView) {
        case 'day':
          newDate = addDays(currentDate, increment);
          break;
        case 'week':
          newDate = addDays(currentDate, increment * 7);
          break;
        case 'month':
          newDate = addDays(currentDate, increment * 30);
          break;
      }
    }

    setCurrentDate(newDate);

    // Update FullCalendar if not in day view
    if (currentView !== 'day' && calendarRef.current) {
      calendarRef.current.getApi().gotoDate(newDate);
    }
  };

  const handleDatesChange = useCallback(
    (start: Date, end: Date) => {
      setVisiblePeriod({ start, end });

      // Check if we're getting close to the edge of loaded data
      // We want to preload before user reaches the edge for smooth experience
      const marginDays = 7; // Preload when within 7 days of edge

      // Check if any loaded range covers the visible period
      const isCurrentlyCovered = loadedRanges.some(
        range => start >= range.start && end <= range.end
      );

      if (!isCurrentlyCovered) {
        // Need to load data for current view
        const extendedStart = addDays(start, -marginDays);
        const extendedEnd = addDays(end, marginDays);
        fetchAdditionalRange(extendedStart, extendedEnd);
        return;
      }

      // Check if we're approaching the edges
      const earliestLoaded = loadedRanges.reduce(
        (min, range) => (!min || range.start < min ? range.start : min),
        null as Date | null
      );

      const latestLoaded = loadedRanges.reduce(
        (max, range) => (!max || range.end > max ? range.end : max),
        null as Date | null
      );

      if (earliestLoaded && start < addDays(earliestLoaded, marginDays)) {
        // Approaching the beginning, load more past data
        const newStart = addDays(earliestLoaded, -30); // Load 30 more days before
        const newEnd = earliestLoaded;
        fetchAdditionalRange(newStart, newEnd);
      }

      if (latestLoaded && end > addDays(latestLoaded, -marginDays)) {
        // Approaching the end, load more future data
        const newStart = latestLoaded;
        const newEnd = addDays(latestLoaded, 30); // Load 30 more days after
        fetchAdditionalRange(newStart, newEnd);
      }
    },
    [loadedRanges, fetchAdditionalRange]
  );

  return {
    handleViewChange,
    handleDateNavigate,
    handleDatesChange,
  };
};