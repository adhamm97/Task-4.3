import React, { useEffect, useMemo, useState } from 'react';

const STORAGE = 'acl-roomgrid-18rooms-v1';
const rooms = [
  'A1-203', 'A2-106', 'A2-107', 'A3-208', 'A3-209',
  'B1-205', 'B1-206', 'B1-207', 'B2-104', 'B2-105', 'B3-301',
  'C1-102', 'C1-103', 'C2-201', 'C2-202', 'C3-101', 'C3-102',
  'D1-101'
];

// End dates are exclusive; all sample reservations use non-overlapping date ranges.
const sampleRows = [
  ['A1-203', '2026-11-09', '2026-11-11', 'Peer tutoring', 'other'],
  ['A1-203', '2026-11-13', '2026-11-15', 'Architecture workshop', 'other'],
  ['A1-203', '2026-11-17', '2026-11-19', 'Group assignment', 'you'],
  ['A2-106', '2026-11-10', '2026-11-13', 'Seminar preparation', 'other'],
  ['A2-106', '2026-11-16', '2026-11-19', 'Study circle', 'other'],
  ['A2-107', '2026-11-09', '2026-11-10', 'Student club planning', 'you'],
  ['A2-107', '2026-11-12', '2026-11-15', 'Project demo rehearsal', 'other'],
  ['A2-107', '2026-11-16', '2026-11-19', 'Study meeting', 'other'],
  ['A3-208', '2026-11-11', '2026-11-14', 'Presentation practice', 'other'],
  ['A3-208', '2026-11-16', '2026-11-18', 'Tutorial group', 'other'],
  ['A3-209', '2026-11-10', '2026-11-12', 'Study session', 'other'],
  ['B1-205', '2026-11-09', '2026-11-11', 'Meeting', 'other'],
  ['B1-205', '2026-11-13', '2026-11-15', 'Team discussion', 'other'],
  ['B1-205', '2026-11-16', '2026-11-18', 'Course project', 'other'],
  ['B1-206', '2026-11-11', '2026-11-13', 'Exam revision', 'other'],
  ['B1-206', '2026-11-17', '2026-11-20', 'Debate practice', 'you'],
  ['B1-207', '2026-11-10', '2026-11-12', 'Group study', 'you'],
  ['B1-207', '2026-11-16', '2026-11-19', 'Engineering project', 'other'],
  ['B2-104', '2026-11-09', '2026-11-11', 'Weekly study group', 'you'],
  ['B2-104', '2026-11-13', '2026-11-15', 'Team planning', 'other'],
  ['B2-104', '2026-11-17', '2026-11-19', 'Workshop preparation', 'other'],
  ['B2-105', '2026-11-12', '2026-11-15', 'Club meeting', 'other'],
  ['B2-105', '2026-11-16', '2026-11-18', 'Student committee', 'other'],
  ['B3-301', '2026-11-09', '2026-11-10', 'Debate practice', 'other'],
  ['B3-301', '2026-11-11', '2026-11-13', 'Group preparation', 'other'],
  ['B3-301', '2026-11-18', '2026-11-20', 'Portfolio review', 'other'],
  ['C1-102', '2026-11-10', '2026-11-14', 'Capstone meeting', 'other'],
  ['C1-102', '2026-11-16', '2026-11-19', 'Revision session', 'other'],
  ['C1-103', '2026-11-09', '2026-11-12', 'Group project', 'other'],
  ['C1-103', '2026-11-14', '2026-11-16', 'Student society', 'you'],
  ['C2-201', '2026-11-12', '2026-11-15', 'Project sprint', 'other'],
  ['C2-201', '2026-11-16', '2026-11-19', 'Robotics club', 'other'],
  ['C2-202', '2026-11-09', '2026-11-11', 'Lab preparation', 'other'],
  ['C2-202', '2026-11-18', '2026-11-20', 'Teaching assistant session', 'other'],
  ['C3-101', '2026-11-12', '2026-11-14', 'Presentation rehearsal', 'you'],
  ['C3-101', '2026-11-14', '2026-11-16', 'Design workshop', 'other'],
  ['C3-101', '2026-11-18', '2026-11-20', 'Study group', 'other'],
  ['C3-102', '2026-11-11', '2026-11-15', 'Research meeting', 'other'],
  ['D1-101', '2026-11-10', '2026-11-13', 'Team check-in', 'other'],
  ['D1-101', '2026-11-16', '2026-11-18', 'Group assignment', 'you'],
];

const seed = sampleRows.map(([roomNumber, startDate, endDate, purpose, owner], index) => ({
  id: `demo-${index + 1}`,
  roomNumber,
  startDate,
  endDate,
  purpose,
  owner
}));

const formEmpty = { roomNumber: '', startDate: '', endDate: '', purpose: '' };

function read() {
  try {
    let a = JSON.parse(localStorage.getItem(STORAGE));
    return Array.isArray(a) ? a : seed;
  } catch {
    return seed;
  }
}

function addDays(iso, days) {
  const t = new Date(`${iso}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() + days);
  return t.toISOString().slice(0, 10);
}

function human(iso) {
  if (!iso) return '';
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short'
  });
}

function weekDay(iso) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    weekday: 'short'
  });
}

function calculateNights(start, end) {
  if (!start || !end || end <= start) return 0;
  const s = new Date(`${start}T12:00:00Z`).getTime();
  const e = new Date(`${end}T12:00:00Z`).getTime();
  return Math.round((e - s) / (1000 * 60 * 60 * 24));
}

function issue(form, bookings, id) {
  if (!form.roomNumber.trim() || !form.startDate || !form.endDate) {
    return 'Complete the room and both dates.';
  }
  if (form.endDate <= form.startDate) {
    return 'End date must follow start date.';
  }
  const conflict = bookings.find(
    b =>
      b.id !== id &&
      b.roomNumber.toLowerCase() === form.roomNumber.trim().toLowerCase() &&
      form.startDate < b.endDate &&
      form.endDate > b.startDate
  );
  if (conflict) {
    const ownerLabel = conflict.owner === 'you' ? 'your other reservation' : 'another reservation';
    return `Conflict: Room ${conflict.roomNumber} is already booked (${human(conflict.startDate)} – ${human(conflict.endDate)}) for ${ownerLabel}.`;
  }
  return '';
}

export default function App() {
  const [bookings, setBookings] = useState(read);
  const [week, setWeek] = useState('2026-11-09');
  const [view, setView] = useState('All rooms');
  const [selectedWing, setSelectedWing] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openOnly, setOpenOnly] = useState(false);
  const [form, setForm] = useState({ ...formEmpty });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('Availability');

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(bookings));
  }, [bookings]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(week, i)), [week]);

  const myBookings = useMemo(
    () => bookings.filter(b => b.owner === 'you').sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [bookings]
  );

  const activeEditingBooking = useMemo(
    () => (editing ? bookings.find(b => b.id === editing) : null),
    [editing, bookings]
  );

  const occupied = (room, date) =>
    bookings.find(b => b.roomNumber === room && date >= b.startDate && date < b.endDate);

  // Filter rooms by specific dropdown view, building wing, text search, and open slots
  const filteredRooms = useMemo(() => {
    let list = view === 'All rooms' ? rooms : rooms.filter(r => r === view);

    if (selectedWing !== 'All') {
      list = list.filter(r => r.startsWith(selectedWing));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(r => r.toLowerCase().includes(q));
    }

    if (openOnly) {
      list = list.filter(r => days.some(day => !occupied(r, day)));
    }

    return list;
  }, [view, selectedWing, searchQuery, openOnly, days, bookings]);

  // Real-time live status of current form entry
  const liveStatus = useMemo(() => {
    if (!form.roomNumber.trim() && !form.startDate && !form.endDate) return null;
    if (!form.roomNumber.trim() || !form.startDate || !form.endDate) {
      return { type: 'incomplete', message: 'Select room and both dates.' };
    }
    const err = issue(form, bookings, editing);
    if (err) {
      return { type: 'conflict', message: err };
    }
    const nights = calculateNights(form.startDate, form.endDate);
    return {
      type: 'available',
      message: `Available for ${nights} ${nights === 1 ? 'day' : 'days'} (${human(form.startDate)} – ${human(form.endDate)})`
    };
  }, [form, bookings, editing]);

  // Handler for clicking a calendar cell
  function handleSlotClick(room, day, b) {
    // If the slot belongs to the user, clicking it enters edit mode directly!
    if (b && b.owner === 'you') {
      edit(b);
      return;
    }

    // If slot is occupied by someone else, show clear feedback rather than setting up a guaranteed conflict
    if (b) {
      setNotice('');
      setError(`Room ${room} is reserved by another student on ${human(day)}. Please choose an open slot.`);
      return;
    }

    // Slot is open:
    setError('');
    if (editing) {
      // Keep edit mode active and update the target dates/room!
      const currentNights = Math.max(1, calculateNights(form.startDate, form.endDate));
      setForm(prev => ({
        ...prev,
        roomNumber: room,
        startDate: day,
        endDate: addDays(day, currentNights)
      }));
      setNotice(`Updated target dates for your reservation to ${room} (${human(day)} – ${human(addDays(day, currentNights))}).`);
    } else {
      // Normal new booking selection
      setForm({
        roomNumber: room,
        startDate: day,
        endDate: addDays(day, 1),
        purpose: ''
      });
      setNotice(`Selected ${room} on ${human(day)}. Complete details below.`);
    }

    document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Edit existing booking
  function edit(row) {
    if (row.owner !== 'you') return;
    setEditing(row.id);
    setForm({
      roomNumber: row.roomNumber,
      startDate: row.startDate,
      endDate: row.endDate,
      purpose: row.purpose || ''
    });
    setError('');
    setNotice(`Adjusting booking for ${row.roomNumber}. You can change fields or click open dates on the calendar.`);
    document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Cancel / delete booking
  function removeBooking(id) {
    const target = bookings.find(b => b.id === id);
    if (!target) return;
    const confirmMsg = `Cancel reservation for room ${target.roomNumber} (${human(target.startDate)} – ${human(target.endDate)})?`;
    if (window.confirm(confirmMsg)) {
      setBookings(prev => prev.filter(b => b.id !== id));
      if (editing === id) {
        setEditing(null);
        setForm({ ...formEmpty });
      }
      setNotice(`Reservation for ${target.roomNumber} was successfully cancelled.`);
      setError('');
    }
  }

  // Handle start date change with auto-sync of end date
  function handleStartDateChange(newStartDate) {
    setForm(prev => {
      let nextEndDate = prev.endDate;
      if (!nextEndDate || nextEndDate <= newStartDate) {
        nextEndDate = addDays(newStartDate, 1);
      }
      return {
        ...prev,
        startDate: newStartDate,
        endDate: nextEndDate
      };
    });
  }

  // Form submission
  function submit(e) {
    e.preventDefault();
    setNotice('');
    const err = issue(form, bookings, editing);
    if (err) {
      setError(err);
      return;
    }

    const payload = {
      roomNumber: form.roomNumber.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      purpose: form.purpose.trim(),
      owner: 'you'
    };

    if (editing) {
      setBookings(bookings.map(b => (b.id === editing ? { ...b, ...payload } : b)));
      setNotice(`Reservation updated successfully for room ${payload.roomNumber}.`);
    } else {
      setBookings([...bookings, { ...payload, id: 'b-' + Date.now() }]);
      setNotice(`Room ${payload.roomNumber} successfully reserved for ${human(payload.startDate)} – ${human(payload.endDate)}.`);
    }

    setForm({ ...formEmpty });
    setEditing(null);
    setError('');
  }

  function reset() {
    setBookings(seed);
    setForm({ ...formEmpty });
    setEditing(null);
    setWeek('2026-11-09');
    setView('All rooms');
    setSelectedWing('All');
    setSearchQuery('');
    setOpenOnly(false);
    setNotice('Example bookings and directory filters restored.');
    setError('');
  }

  function check() {
    setNotice('');
    setError('');
    const e = issue(form, bookings, editing);
    if (e) {
      setError(e);
    } else {
      const nights = calculateNights(form.startDate, form.endDate);
      setNotice(`Confirmed: Room ${form.roomNumber} is open and available for all ${nights} days (${human(form.startDate)} – ${human(form.endDate)}).`);
    }
  }

  return (
    <div className="room-app">
      <header className="topbar">
        <div className="mark">
          <span className="mark-sq">R</span>
          <span>
            <strong>room<span>grid</span></strong>
            <small>Campus spaces</small>
          </span>
        </div>
        <nav>
          <button
            className={tab === 'Availability' ? 'selected' : ''}
            onClick={() => {
              setTab('Availability');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Availability
          </button>
          <button
            className={tab === 'My bookings' ? 'selected' : ''}
            onClick={() => {
              setTab('My bookings');
              document.getElementById('my-reservations')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            My bookings <span className="nav-badge">{myBookings.length}</span>
          </button>
          <button onClick={reset}>Reset demo</button>
        </nav>
        <div className="member">
          <span>Student dashboard</span>
          <div className="profile">YOU</div>
        </div>
      </header>

      <main>
        <section className="intro">
          <div>
            <span className="eyebrow">SPACES / RESERVATIONS</span>
            <h1>Find room availability</h1>
            <p>Review campus rooms, dates and existing reservations in one view.</p>
          </div>
          <div className="intro-summary">
            <span>ROOMS IN DIRECTORY</span>
            <strong>{rooms.length.toString().padStart(2, '0')}</strong>
            <span>CURRENT RESERVATIONS</span>
            <strong>{bookings.length.toString().padStart(2, '0')}</strong>
          </div>
        </section>

        <div className="pagegrid">
          <section className="calendar-pane">
            <div className="calendar-head">
              <div>
                <span className="eyebrow">AVAILABILITY CALENDAR</span>
                <h2>Rooms by day</h2>
              </div>
              <div className="weeknav">
                <button aria-label="Previous week" onClick={() => setWeek(addDays(week, -7))}>←</button>
                <strong>{human(week)} – {human(addDays(week, 6))}</strong>
                <button aria-label="Next week" onClick={() => setWeek(addDays(week, 7))}>→</button>
              </div>
            </div>

            {/* Editing mode banner */}
            {activeEditingBooking && (
              <div className="editing-banner" role="status">
                <div className="editing-banner-content">
                  <span className="editing-indicator">✏️ EDITING MODE</span>
                  <p>
                    Adjusting reservation for <strong>{activeEditingBooking.roomNumber}</strong> ({human(activeEditingBooking.startDate)} – {human(activeEditingBooking.endDate)}).
                    Click any open slot in the calendar to reschedule, or edit fields in the form.
                  </p>
                </div>
                <button
                  type="button"
                  className="banner-cancel-btn"
                  onClick={() => {
                    setEditing(null);
                    setForm({ ...formEmpty });
                    setError('');
                  }}
                >
                  Cancel editing
                </button>
              </div>
            )}

            {/* Enhanced Controls & Filters */}
            <div className="calendar-controls">
              <div className="controls-row">
                <label>
                  Wing:
                  <div className="wing-chips">
                    {['All', 'A', 'B', 'C', 'D'].map(wing => (
                      <button
                        key={wing}
                        type="button"
                        className={`chip ${selectedWing === wing ? 'chip-active' : ''}`}
                        onClick={() => setSelectedWing(wing)}
                      >
                        {wing === 'All' ? 'All wings' : `Wing ${wing}`}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="search-filter">
                  <span className="sr-only">Search</span>
                  <input
                    type="search"
                    placeholder="Search room (e.g. B2)..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="room-search-input"
                  />
                </label>

                <label className="checkbox-filter">
                  <input
                    type="checkbox"
                    checked={openOnly}
                    onChange={e => setOpenOnly(e.target.checked)}
                  />
                  <span>Open dates only</span>
                </label>

                <label className="dropdown-filter">
                  Specific room:
                  <select value={view} onChange={e => setView(e.target.value)}>
                    <option>All rooms</option>
                    {rooms.map(r => <option key={r}>{r}</option>)}
                  </select>
                </label>
              </div>

              <div className="legend-row">
                <span className="legend"><i className="free" /> Available (Click to book)</span>
                <span className="legend"><i className="my-booking" /> Your booking (Click to edit)</span>
                <span className="legend"><i className="booked" /> Reserved by other</span>
                <p>Showing {filteredRooms.length} of {rooms.length} rooms</p>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="calendar-scroll">
              <div className="room-cal">
                <div className="corner">ROOM / DATE</div>
                {days.map(d => (
                  <div className="dayhead" key={d}>
                    <strong>{weekDay(d)}</strong>
                    <span>{human(d)}</span>
                  </div>
                ))}
                {filteredRooms.length === 0 ? (
                  <div className="empty-rooms-msg">No rooms match your filter criteria. Try clearing search or wing filters.</div>
                ) : (
                  filteredRooms.map(room => (
                    <React.Fragment key={room}>
                      <div className="roomname">
                        <strong>{room}</strong>
                        <small>Study room · {room[0]}</small>
                      </div>
                      {days.map(day => {
                        const b = occupied(room, day);
                        const isOwn = b && b.owner === 'you';
                        const isCurrentlyEdited = activeEditingBooking && b && b.id === activeEditingBooking.id;

                        let slotClass = 'slot ';
                        if (isCurrentlyEdited) {
                          slotClass += 'editing-slot ';
                        } else if (isOwn) {
                          slotClass += 'my-booking ';
                        } else if (b) {
                          slotClass += 'taken disabled ';
                        } else {
                          slotClass += 'available ';
                        }

                        let slotTitle = `${room}, ${day}: `;
                        if (isCurrentlyEdited) slotTitle += 'Currently editing this booking';
                        else if (isOwn) slotTitle += 'Your reservation (Click to adjust)';
                        else if (b) slotTitle += `Reserved (${b.purpose || 'Peer activity'})`;
                        else slotTitle += 'Open (Click to reserve)';

                        return (
                          <button
                            key={room + day}
                            type="button"
                            title={slotTitle}
                            className={slotClass}
                            onClick={() => handleSlotClick(room, day, b)}
                            aria-label={slotTitle}
                          >
                            <span>
                              {isCurrentlyEdited ? 'Editing' : isOwn ? '★ You' : b ? 'Booked' : 'Open'}
                            </span>
                            <small>
                              {isCurrentlyEdited ? 'Selected' : isOwn ? 'Your booking' : b ? 'Reserved' : '+ Reserve'}
                            </small>
                          </button>
                        );
                      })}
                    </React.Fragment>
                  ))
                )}
              </div>
            </div>

            <p className="calendar-note">
              Cells show individual dates. End dates are exclusive (e.g. 9 Nov to 11 Nov reserves 9 and 10 Nov). Click any open slot to quickly set the date range.
            </p>

            {/* My Reservations Section */}
            <section id="my-reservations" className="reservations">
              <div className="reservations-head">
                <h2>Your bookings</h2>
                <span>{myBookings.length} {myBookings.length === 1 ? 'record' : 'records'}</span>
              </div>
              <div className="reservations-list">
                {myBookings.map(b => (
                  <article key={b.id} className={`reservation ${editing === b.id ? 'reservation-active-edit' : ''}`}>
                    <div className="room-chip">{b.roomNumber}</div>
                    <div className="reservation-body">
                      <strong>{human(b.startDate)} – {human(b.endDate)}</strong>
                      <span className="nights-tag">{calculateNights(b.startDate, b.endDate)} nights</span>
                      <small>{b.purpose || 'No purpose entered'}</small>
                    </div>
                    <div className="reservation-actions">
                      <button
                        type="button"
                        className="btn-change"
                        onClick={() => edit(b)}
                        title="Edit dates or room"
                      >
                        {editing === b.id ? 'Editing...' : 'Change'}
                      </button>
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => removeBooking(b.id)}
                        title="Cancel this reservation"
                      >
                        Cancel
                      </button>
                    </div>
                  </article>
                ))}
                {myBookings.length === 0 && <p className="no-bookings-msg">You have no active reservations. Click any open slot above to reserve a room.</p>}
              </div>
            </section>
          </section>

          {/* Booking Form Panel */}
          <aside className="booking-pane" id="booking-form">
            <div className="panel-tag">
              <span>{editing ? 'ADJUST RESERVATION' : 'BOOK A ROOM'}</span>
              <span>{editing ? 'EDIT MODE' : 'FORM 01'}</span>
            </div>
            <h2>{editing ? 'Change reservation' : 'Make a reservation'}</h2>
            <p className="booking-description">
              {editing
                ? `Modifying reservation for room ${form.roomNumber || '...'}. Select new dates or enter a different room.`
                : 'Use this panel to request a room for your study group, meeting or activity.'}
            </p>

            {/* Real-time Inline Availability Badge */}
            {liveStatus && (
              <div className={`live-status-pill ${liveStatus.type}`} role="status">
                <span className="pill-icon">
                  {liveStatus.type === 'available' ? '✓' : liveStatus.type === 'conflict' ? '⚠' : 'ℹ'}
                </span>
                <span className="pill-text">{liveStatus.message}</span>
              </div>
            )}

            {notice && <div className="success" role="status">{notice}</div>}
            {error && <div className="error" role="alert">{error}</div>}

            <form onSubmit={submit}>
              <label>
                <span>Room number</span>
                <input
                  list="rooms"
                  placeholder="e.g., B2-104"
                  value={form.roomNumber}
                  onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value.toUpperCase() }))}
                  required
                />
                <datalist id="rooms">
                  {rooms.map(r => <option key={r} value={r} />)}
                </datalist>
              </label>

              <div className="date-pair">
                <label>
                  <span>Start date</span>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => handleStartDateChange(e.target.value)}
                    required
                  />
                </label>
                <label>
                  <span>End date (exclusive)</span>
                  <input
                    type="date"
                    min={form.startDate ? addDays(form.startDate, 1) : undefined}
                    value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    required
                  />
                </label>
              </div>

              {form.startDate && form.endDate && form.endDate > form.startDate && (
                <div className="duration-preview">
                  <span>Selected duration:</span>
                  <strong>{calculateNights(form.startDate, form.endDate)} nights</strong>
                  <small>({human(form.startDate)} to morning of {human(form.endDate)})</small>
                </div>
              )}

              <label>
                <span>Purpose / optional</span>
                <textarea
                  rows="4"
                  placeholder="Meeting, group study, presentation rehearsal..."
                  value={form.purpose}
                  onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                />
              </label>

              <p className="helper">
                Start and end dates are required. End date is strictly after start date. Reservations cannot overlap existing bookings for the same room.
              </p>

              <button className="availability-check" type="button" onClick={check}>
                Check availability
              </button>

              <button className="reserve-button" type="submit">
                {editing ? 'Save booking changes' : 'Confirm booking'}
              </button>

              {editing && (
                <div className="edit-action-row">
                  <button
                    className="cancel-edit"
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      setForm({ ...formEmpty });
                      setError('');
                      setNotice('Editing canceled.');
                    }}
                  >
                    Cancel editing
                  </button>
                  <button
                    className="delete-edit-btn"
                    type="button"
                    onClick={() => removeBooking(editing)}
                  >
                    Delete reservation
                  </button>
                </div>
              )}
            </form>

            <div className="right-foot">
              <span>✦</span> Need a common room for a study session? Pick any open green slot in the calendar to quickly autofill the reservation form.
            </div>
          </aside>
        </div>
      </main>

      <footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
    </div>
  );
}
