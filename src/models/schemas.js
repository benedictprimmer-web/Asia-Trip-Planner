import { z } from 'zod';

export const TripSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Trip name is required'),
  createdAt: z.string().optional(),
});

export const StopSchema = z.object({
  id: z.number().optional(),
  tripId: z.number(),
  order: z.number().default(0),
  cityName: z.string().min(1),
  countryName: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  arrivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  notes: z.string().optional().default(''),
});
