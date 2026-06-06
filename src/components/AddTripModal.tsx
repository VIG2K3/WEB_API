import React, { useState } from 'react';
import { Place, Trip } from '../types/trip';
import '../styles/AddTripModal.css';

interface AddTripModalProps {
  place: Place;
  onClose: () => void;
  onSubmit: (tripData: Omit<Trip, '_id'>) => void;
  loading?: boolean;
}

export default function AddTripModal({ place, onClose, onSubmit, loading = false }: AddTripModalProps) {
  const [startDate,    setStartDate]    = useState('');
  const [endDate,      setEndDate]      = useState('');
  const [notes,        setNotes]        = useState('');
  const [budgetTotal,  setBudgetTotal]  = useState<string>('');

  const todayISO = new Date().toISOString().split('T')[0];

  const determineStatus = (start?: string, end?: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDateValue = start ? new Date(start) : null;
    const endDateValue   = end   ? new Date(end)   : null;
    if (startDateValue) startDateValue.setHours(0, 0, 0, 0);
    if (endDateValue)   endDateValue.setHours(0, 0, 0, 0);

    if (!startDateValue && !endDateValue) return 'upcoming';
    if (startDateValue && !endDateValue) {
      if (today < startDateValue) return 'upcoming';
      if (today > startDateValue) return 'completed';
      return 'ongoing';
    }
    if (!startDateValue && endDateValue) {
      return today > endDateValue ? 'completed' : 'upcoming';
    }
    if (today < (startDateValue as Date)) return 'upcoming';
    if (today > (endDateValue   as Date)) return 'completed';
    return 'ongoing';
  };

  const selectedStatus = determineStatus(startDate, endDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (startDate && endDate && startDate > endDate) {
      alert('End date cannot be before start date.');
      return;
    }

    const tripData: Omit<Trip, '_id'> = {
      destination: place.name,
      country:     'Penang, Malaysia',
      dates:       startDate && endDate ? `${startDate} to ${endDate}` : 'Flexible dates',
      startDate,
      endDate,
      image:       'https://placehold.co/640x480?text=Penang+Trip',
      weather: {
        temp:      'N/A',
        condition: 'Upcoming',
        humidity:  'N/A',
        wind:      'N/A',
        feelsLike: 'N/A',
        icon:      '🌤️',
      },
      attractions: [],
      notes,
      preferences: '',
      status:      selectedStatus,
      budget: {
        total: parseFloat(budgetTotal) || 0,
        items: [],
      },
    };

    onSubmit(tripData);
  };

  const spent     = 0; // no items yet at creation
  const remaining = parseFloat(budgetTotal) || 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📍 Add Trip to {place.name}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="trip-form">

          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              min={todayISO}
              onChange={(e) => {
                const value = e.target.value;
                setStartDate(value);
                if (endDate && value && value > endDate) setEndDate('');
              }}
            />
          </div>

          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              min={startDate || todayISO}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <div className="status-display">
              {selectedStatus === 'upcoming' ? '📅 Upcoming'
                : selectedStatus === 'ongoing' ? '🔄 Ongoing'
                : '✅ Completed'}
            </div>
          </div>

          {/* ── Budget ── */}
          <div className="form-group">
            <label>💰 Total Budget (RM)</label>
            <input
              type="number"
              min={0}
              placeholder="e.g. 1500"
              value={budgetTotal}
              onChange={(e) => setBudgetTotal(e.target.value)}
            />
          </div>

          {/* Budget summary preview — only shown when a value is entered */}
          {parseFloat(budgetTotal) > 0 && (
            <div className="budget-preview">
              <div className="budget-preview-row">
                <span className="budget-preview-label">Total Budget</span>
                <span className="budget-preview-value budget-total">
                  RM {parseFloat(budgetTotal).toLocaleString()}
                </span>
              </div>
              <div className="budget-preview-row">
                <span className="budget-preview-label">Spent</span>
                <span className="budget-preview-value budget-spent">RM 0</span>
              </div>
              <div className="budget-preview-row">
                <span className="budget-preview-label">Remaining</span>
                <span className="budget-preview-value budget-remaining">
                  RM {remaining.toLocaleString()}
                </span>
              </div>
              <div className="budget-bar-track">
                <div className="budget-bar-fill" style={{ width: '0%' }} />
              </div>
              <p className="budget-preview-hint">
                You can add individual expenses in the Budget tab after saving.
              </p>
            </div>
          )}

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this trip (activities, packing list, etc.)"
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? '⏳ Saving...' : '💾 Save Trip'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}