CREATE TABLE IF NOT EXISTS flights (
  flight_id integer PRIMARY KEY,
  route_code text NOT NULL,
  airline_code text NOT NULL,
  airline_name text NOT NULL,
  flight_number text NOT NULL,
  origin_city text NOT NULL,
  origin_airport_code text NOT NULL,
  origin_airport_name text NOT NULL,
  destination_city text NOT NULL,
  destination_airport_code text NOT NULL,
  destination_airport_name text NOT NULL,
  flight_date date NOT NULL,
  departure_time time NOT NULL,
  arrival_time time NOT NULL,
  departure_datetime timestamp NOT NULL,
  arrival_datetime timestamp NOT NULL,
  duration_minutes integer NOT NULL,
  stops integer NOT NULL,
  cabin_class text NOT NULL,
  price_twd integer NOT NULL,
  currency text NOT NULL DEFAULT 'TWD',
  seats_total integer NOT NULL,
  seats_available integer NOT NULL,
  baggage_kg integer NOT NULL,
  status text NOT NULL,
  source_type text,
  created_at timestamp,
  updated_at timestamp
);

CREATE INDEX IF NOT EXISTS idx_flights_search
  ON flights (origin_airport_code, destination_airport_code, flight_date, cabin_class, price_twd);

CREATE INDEX IF NOT EXISTS idx_flights_airline
  ON flights (airline_code);

CREATE INDEX IF NOT EXISTS idx_flights_departure_datetime
  ON flights (departure_datetime);
