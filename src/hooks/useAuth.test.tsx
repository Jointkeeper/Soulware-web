import { renderHook, act } from '@testing-library/react';
import { useRouter } from 'next/router';
import { useAuth } from './useAuth';
import { supabase, signIn, signUp, signOut as supabaseSignOut } from '@/lib/supabase';
import { useToasts } from '@/context/ToastContext';
import { useTranslation } from 'next-i18next';

// Mocks
vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(), // Renamed to supabaseSignOut in useAuth imports, ensure consistency
}));

vi.mock('@/context/ToastContext', () => ({
  useToasts: vi.fn(),
}));

vi.mock('next-i18next', () => ({
  useTranslation: vi.fn(),
}));

const mockPush = vi.fn();
const mockAddToast = vi.fn();
const mockT = vi.fn((key) => key); // Simple mock for t function

let capturedAuthChangeCallback: ((event: string, session: any) => void) | null = null;

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedAuthChangeCallback = null; // Reset for each test

    (useRouter as vi.Mock).mockReturnValue({ push: mockPush });
    (useToasts as vi.Mock).mockReturnValue({ addToast: mockAddToast });
    (useTranslation as vi.Mock).mockReturnValue({ t: mockT, i18n: { language: 'ru' } });

    // Mock onAuthStateChange to capture the callback and return an unsubscribe function
    (supabase.auth.onAuthStateChange as vi.Mock).mockImplementation((handlerPassedByUseAuth: (event: string, session: any) => void) => {
      console.log('[TEST MOCK] supabase.auth.onAuthStateChange mockImplementation called'); 
      capturedAuthChangeCallback = handlerPassedByUseAuth; // This is the callback defined in useAuth.ts
      if (!handlerPassedByUseAuth) {
        console.log('[TEST MOCK] handlerPassedByUseAuth to onAuthStateChange was null/undefined!');
      }
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      };
    });
  });

  it('should initialize with loading true and no user', async () => {
    (supabase.auth.getUser as vi.Mock).mockResolvedValue({ data: { user: null } });
    
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    // Wait for useEffect to complete initial getUser and onAuthStateChange calls
    await act(async () => {}); 
  });

  it('should set user and loading to false after auth state change', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    (supabase.auth.getUser as vi.Mock).mockResolvedValue({ data: { user: null } }); // Initial call

    const { result } = renderHook(() => useAuth());
    
    // Initial loading state might be true, or become true after getUser
    // Then onAuthStateChange callback sets it to false.
    // Let effects settle
    await act(async () => {}); 

    if (!capturedAuthChangeCallback) {
      // This console.log will help in CI if the test fails here
      console.log('[TEST FAILURE] capturedAuthChangeCallback is null in test.');
      throw new Error("onAuthStateChange callback was not captured by the mock. Check useEffect in useAuth and mock setup.");
    }

    // Check loading state *before* triggering the callback that sets it to false
    // This depends on whether initial setLoading(false) is only in onAuthStateChange
    // In useAuth, setLoading(false) is ONLY in onAuthStateChange. getUser() does not set it.
    // So, result.current.loading should still be true here.
    expect(result.current.loading).toBe(true);

    await act(async () => {
      capturedAuthChangeCallback('SIGNED_IN', { user: mockUser });
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

 it('should call signIn and handle success', async () => {
    const email = 'test@example.com';
    const password = 'password';
    const mockUser = { id: '123', email };
    (signIn as vi.Mock).mockResolvedValue({ data: { user: mockUser }, error: null });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.login(email, password);
    });

    expect(signIn).toHaveBeenCalledWith(email, password);
    expect(mockAddToast).toHaveBeenCalledWith('auth.loginSuccess', 'success');
    expect(mockPush).toHaveBeenCalledWith('/profile');
  });

  it('should call signIn and handle error', async () => {
    const email = 'test@example.com';
    const password = 'password';
    const errorMessage = 'Invalid credentials';
    (signIn as vi.Mock).mockRejectedValue({ message: errorMessage });
    // Explicitly type the mock implementation for clarity
    mockT.mockImplementation((key: string, options?: { message: string }) => {
      if (options && options.message) {
        return `${key}_${options.message}`;
      }
      return key;
    });

    const { result } = renderHook(() => useAuth());
    await expect(act(async () => {
      await result.current.login(email, password);
    })).rejects.toThrow(errorMessage);

    expect(signIn).toHaveBeenCalledWith(email, password);
    expect(mockAddToast).toHaveBeenCalledWith(`auth.loginError_${errorMessage}`, 'error');
    expect(mockPush).not.toHaveBeenCalled();
  });

  // Similar tests for register and signOut

   it('should call signOut and handle success', async () => {
    (supabaseSignOut as vi.Mock).mockResolvedValue({ error: null });
    (supabase.auth.getUser as vi.Mock).mockResolvedValue({ data: { user: {id: '123'} }});
    // The onAuthStateChange mock is already set up in beforeEach

    const { result } = renderHook(() => useAuth());
    await act(async () => {}); // Allow useEffect to run and capture callback

    // Simulate user being initially set via auth state change
    if (capturedAuthChangeCallback) {
        await act(async () => {
            capturedAuthChangeCallback('SIGNED_IN', { user: {id: '123'} });
        });
    }

    await act(async () => {
      await result.current.signOut();
    });

    expect(supabaseSignOut).toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledWith('auth.logoutSuccess', 'info');
    expect(mockPush).toHaveBeenCalledWith('/');
  });

}); 