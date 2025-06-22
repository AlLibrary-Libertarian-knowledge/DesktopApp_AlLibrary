import { Component, createSignal } from 'solid-js';
import { Calendar, Clock, Filter } from 'lucide-solid';
import { Button } from '../../../foundation/Button';
import { Select } from '../../../foundation/Select';
import styles from './TimeFilter.module.css';

export interface TimeFilterProps {
  onFilterChange?: (filter: TimeFilterValue) => void;
  class?: string;
}

export interface TimeFilterValue {
  period: string;
  startDate?: Date;
  endDate?: Date;
}

export const TimeFilter: Component<TimeFilterProps> = props => {
  const [selectedPeriod, setSelectedPeriod] = createSignal('all');
  const [customStart, setCustomStart] = createSignal('');
  const [customEnd, setCustomEnd] = createSignal('');

  const timeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);

    let filter: TimeFilterValue = { period };

    // Calculate date ranges for predefined periods
    const now = new Date();
    switch (period) {
      case 'today':
        filter.startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filter.endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        filter.startDate = weekStart;
        filter.endDate = now;
        break;
      case 'month':
        filter.startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        filter.endDate = now;
        break;
      case 'year':
        filter.startDate = new Date(now.getFullYear(), 0, 1);
        filter.endDate = now;
        break;
    }

    props.onFilterChange?.(filter);
  };

  const handleCustomDateChange = () => {
    if (customStart() && customEnd()) {
      const filter: TimeFilterValue = {
        period: 'custom',
        startDate: new Date(customStart()),
        endDate: new Date(customEnd()),
      };
      props.onFilterChange?.(filter);
    }
  };

  return (
    <div class={`${styles.timeFilter} ${props.class || ''}`}>
      <div class={styles.filterHeader}>
        <Clock size={16} />
        <span>Time Filter</span>
      </div>

      <div class={styles.filterControls}>
        <Select
          options={timeOptions}
          value={selectedPeriod()}
          onChange={handlePeriodChange}
          placeholder="Select time period"
        />

        {selectedPeriod() === 'custom' && (
          <div class={styles.customRange}>
            <div class={styles.dateInput}>
              <Calendar size={16} />
              <input
                type="date"
                value={customStart()}
                onInput={e => setCustomStart(e.target.value)}
                onChange={handleCustomDateChange}
                class={styles.dateField}
              />
            </div>
            <span class={styles.dateSeparator}>to</span>
            <div class={styles.dateInput}>
              <Calendar size={16} />
              <input
                type="date"
                value={customEnd()}
                onInput={e => setCustomEnd(e.target.value)}
                onChange={handleCustomDateChange}
                class={styles.dateField}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeFilter;
