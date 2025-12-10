import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SelectedSeat {
  id: number;
  row: string;
  seatNumber: number;
}

interface BookingContextType {
  selectedSeats: SelectedSeat[];
  selectSeat: (seat: SelectedSeat) => void;
  deselectSeat: (seatId: number) => void;
  clearSelection: () => void;
  isSelected: (seatId: number) => boolean;
  toggleSeat: (seat: SelectedSeat) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);

  const selectSeat = useCallback((seat: SelectedSeat) => {
    setSelectedSeats(prev => {
      if (prev.find(s => s.id === seat.id)) return prev;
      if (prev.length >= 10) return prev; // Max 10 seats
      return [...prev, seat];
    });
  }, []);

  const deselectSeat = useCallback((seatId: number) => {
    setSelectedSeats(prev => prev.filter(s => s.id !== seatId));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSeats([]);
  }, []);

  const isSelected = useCallback((seatId: number) => {
    return selectedSeats.some(s => s.id === seatId);
  }, [selectedSeats]);

  const toggleSeat = useCallback((seat: SelectedSeat) => {
    setSelectedSeats(prev => {
      const exists = prev.find(s => s.id === seat.id);
      if (exists) {
        return prev.filter(s => s.id !== seat.id);
      }
      if (prev.length >= 10) return prev;
      return [...prev, seat];
    });
  }, []);

  return (
    <BookingContext.Provider value={{
      selectedSeats,
      selectSeat,
      deselectSeat,
      clearSelection,
      isSelected,
      toggleSeat,
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
