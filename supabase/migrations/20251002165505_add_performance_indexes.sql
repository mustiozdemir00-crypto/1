/*
  # Performance Optimization - Add Database Indexes

  1. Performance Improvements
    - Add index on `reservations.appointment_date` for faster date filtering
    - Add index on `reservations.appointment_time` for time-based queries
    - Add index on `reservations.artist_id` for artist-specific lookups
    - Add index on `reservations.created_at` for sorting optimization
    - Add index on `staff.role` for role-based filtering
    - Add index on `staff.username` for login queries

  2. Notes
    - These indexes will significantly improve query performance
    - Indexes on frequently queried columns reduce database load
    - The `IF NOT EXISTS` clauses prevent errors if indexes already exist
*/

-- Add index on appointment date for faster date filtering
CREATE INDEX IF NOT EXISTS idx_reservations_appointment_date 
  ON reservations(appointment_date);

-- Add index on appointment time for time-based queries
CREATE INDEX IF NOT EXISTS idx_reservations_appointment_time 
  ON reservations(appointment_time);

-- Add index on artist_id for artist-specific lookups
CREATE INDEX IF NOT EXISTS idx_reservations_artist_id 
  ON reservations(artist_id);

-- Add index on created_at for sorting optimization (descending order)
CREATE INDEX IF NOT EXISTS idx_reservations_created_at_desc 
  ON reservations(created_at DESC);

-- Add index on staff role for role-based filtering
CREATE INDEX IF NOT EXISTS idx_staff_role 
  ON staff(role);

-- Add index on staff username for login queries
CREATE INDEX IF NOT EXISTS idx_staff_username 
  ON staff(username);