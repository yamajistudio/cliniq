import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock global do Supabase client — cada teste configura os retornos específicos
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));
