import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { User } from '@supabase/supabase-js';
import { supabase, signIn, signUp, signOut as supabaseSignOut } from '@/lib/supabase';
import { useToasts } from '@/context/ToastContext';
import { useTranslation } from 'next-i18next';
import { logger } from '@/lib/logger';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { addToast } = useToasts();
  const { t } = useTranslation('common');

  useEffect(() => {
    // Получаем текущего пользователя
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        // Не устанавливаем loading здесь, onAuthStateChange сделает это
        setUser(user);
      } catch (error) {
        logger.error('Error getting current user in useAuth', error);
      }
    };

    // Подписываемся на изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    getCurrentUser();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await signIn(email, password);
      addToast(t('auth.loginSuccess'), 'success');
      logger.info('User logged in successfully', { email });
      router.push('/profile');
      return data;
    } catch (error: any) {
      logger.error('Error signing in', error, { email });
      addToast(t('auth.loginError', { message: error.message || 'Unknown error' }), 'error');
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const data = await signUp(email, password);
      addToast(t('auth.registerSuccess'), 'success');
      logger.info('User registered successfully', { email });
      router.push('/profile');
      return data;
    } catch (error: any) {
      logger.error('Error signing up', error, { email });
      addToast(t('auth.registerError', { message: error.message || 'Unknown error' }), 'error');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabaseSignOut();
      addToast(t('auth.logoutSuccess'), 'info');
      logger.info('User signed out successfully', { userId: user?.id });
      router.push('/');
    } catch (error: any) {
      logger.error('Error signing out', error, { userId: user?.id });
      addToast(t('auth.logoutError', { message: error.message || 'Unknown error' }), 'error');
      throw error;
    }
  };

  return {
    user,
    loading,
    login,
    register,
    signOut
  };
} 