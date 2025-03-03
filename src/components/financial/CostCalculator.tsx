import React, { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { formatAmount } from '@/lib/utils';

const CostCalculator = () => {
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);
  const [dailyRate, setDailyRate] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  const calculateTotalAmount = () => {
    if (selectedDateRange) {
      const days = (selectedDateRange.to?.getTime() - selectedDateRange.from?.getTime()) / (1000 * 3600 * 24) + 1;
      const amount = dailyRate * days;
      setTotalAmount(amount);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Cost Calculator</h3>
      <DatePickerWithRange
        dateRange={selectedDateRange}
        onDateRangeChange={setSelectedDateRange}
      />
      <div className="flex items-center space-x-4">
        <input
          type="number"
          placeholder="Daily Rate"
          value={dailyRate}
          onChange={(e) => setDailyRate(Number(e.target.value))}
          className="border rounded p-2"
        />
        <Button onClick={calculateTotalAmount}>Calculate</Button>
      </div>
      {totalAmount > 0 && (
        <div className="font-bold">
          Total Amount: {formatAmount(totalAmount)}
        </div>
      )}
    </div>
  );
};

export default CostCalculator;
