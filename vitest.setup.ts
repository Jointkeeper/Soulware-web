import '@testing-library/jest-dom/vitest'; // Extends Vitest's expect with jest-dom matchers

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key';
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx';
process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID = 'price_premium_test_id';
process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID = 'price_professional_test_id';

// You can add other global setup here if needed, for example:
// - Mocking global objects (localStorage, fetch)
// - Setting up a global MSW (Mock Service Worker) for API mocking

// Example: Mocking localStorage
// const localStorageMock = (() => {
//   let store: Record<string, string> = {};
//   return {
//     getItem: (key: string) => store[key] || null,
//     setItem: (key: string, value: string) => {
//       store[key] = value.toString();
//     },
//     removeItem: (key: string) => {
//       delete store[key];
//     },
//     clear: () => {
//       store = {};
//     },
//   };
// })();
// Object.defineProperty(window, 'localStorage', { value: localStorageMock }); 