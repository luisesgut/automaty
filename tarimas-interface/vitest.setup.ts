import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Next.js router/navigation utilities when tests access them.
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    pathname: '/',
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));
