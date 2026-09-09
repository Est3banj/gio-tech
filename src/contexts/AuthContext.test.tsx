import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { AuthProvider, AuthContext } from './AuthContext';
import { useAuth } from '../hooks/useAuth';
import {
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  onAuthStateChanged,
} from 'firebase/auth';
import { onSnapshot } from 'firebase/firestore';

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  setPersistence: vi.fn(),
  browserLocalPersistence: 'LOCAL',
  browserSessionPersistence: 'SESSION',
  onAuthStateChanged: vi.fn(),
}));

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn((_db, collection, id) => ({ collection, id })),
  onSnapshot: vi.fn(),
}));

// Mock Firebase instance
vi.mock('../firebase', () => ({
  auth: {},
  db: {},
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext & useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws an error if useAuth is used outside of AuthProvider', () => {
    // Suppress React error boundary console log for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth debe ser utilizado dentro de un AuthProvider'
    );
    consoleSpy.mockRestore();
  });

  it('initializes with null user and loading false when no user is signed in', async () => {
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      (callback as (user: unknown) => void)(null);
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.role).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets user with role from Firestore when user is authenticated', async () => {
    const mockAuthUser = {
      uid: 'user-123',
      email: 'admin@giotech.com',
      displayName: 'Admin User',
    };

    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      (callback as (user: unknown) => void)(mockAuthUser);
      return vi.fn();
    });

    vi.mocked(onSnapshot).mockImplementation((_ref, callback) => {
      (callback as (snap: unknown) => void)({
        exists: () => true,
        data: () => ({
          rol: 'admin',
          nombreCompleto: 'Admin User Full',
          whatsappNumber: '3223652569',
        }),
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual({
      uid: 'user-123',
      email: 'admin@giotech.com',
      rol: 'admin',
      nombreCompleto: 'Admin User Full',
      whatsappNumber: '3223652569',
      fechaCreacion: undefined,
    });
    expect(result.current.role).toBe('admin');
    expect(result.current.loading).toBe(false);
  });

  it('defaults role to cliente when Firestore document does not exist', async () => {
    const mockAuthUser = {
      uid: 'user-456',
      email: 'client@giotech.com',
    };

    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      (callback as (user: unknown) => void)(mockAuthUser);
      return vi.fn();
    });

    vi.mocked(onSnapshot).mockImplementation((_ref, callback) => {
      (callback as (snap: unknown) => void)({
        exists: () => false,
        data: () => ({}),
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual({
      uid: 'user-456',
      email: 'client@giotech.com',
      rol: 'cliente',
    });
    expect(result.current.role).toBe('cliente');
    expect(result.current.loading).toBe(false);
  });

  it('defaults role to cliente when Firestore document has invalid or corrupt role', async () => {
    const mockAuthUser = {
      uid: 'user-789',
      email: 'corrupt@giotech.com',
    };

    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      (callback as (user: unknown) => void)(mockAuthUser);
      return vi.fn();
    });

    vi.mocked(onSnapshot).mockImplementation((_ref, callback) => {
      (callback as (snap: unknown) => void)({
        exists: () => true,
        data: () => ({ rol: 'super_hacker_role' }),
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user?.rol).toBe('cliente');
    expect(result.current.role).toBe('cliente');
    expect(result.current.loading).toBe(false);
  });

  it('handles snapshot error gracefully by setting role to cliente and loading false', async () => {
    const mockAuthUser = {
      uid: 'user-err',
      email: 'error@giotech.com',
    };

    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      (callback as (user: unknown) => void)(mockAuthUser);
      return vi.fn();
    });

    vi.mocked(onSnapshot).mockImplementation((_ref, _callback, errorCallback) => {
      if (errorCallback) {
        (errorCallback as (err: unknown) => void)(new Error('Permission denied'));
      }
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual({
      uid: 'user-err',
      email: 'error@giotech.com',
      rol: 'cliente',
    });
    expect(result.current.role).toBe('cliente');
    expect(result.current.loading).toBe(false);
  });

  it('calls login with email, password, and persistence correctly', async () => {
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      (callback as (user: unknown) => void)(null);
      return vi.fn();
    });
    vi.mocked(setPersistence).mockResolvedValue(undefined as never);
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({} as never);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('test@test.com', 'password123', true);
    });

    expect(setPersistence).toHaveBeenCalledWith(expect.anything(), 'LOCAL');
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'test@test.com',
      'password123'
    );
    expect(result.current.error).toBeNull();
  });

  it('handles login failure and sets error state', async () => {
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      (callback as (user: unknown) => void)(null);
      return vi.fn();
    });
    vi.mocked(setPersistence).mockResolvedValue(undefined as never);
    vi.mocked(signInWithEmailAndPassword).mockRejectedValue(
      new Error('Invalid password')
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      try {
        await result.current.login('test@test.com', 'wrongpassword', false);
      } catch {
        // Expected to throw
      }
    });

    expect(setPersistence).toHaveBeenCalledWith(expect.anything(), 'SESSION');
    expect(result.current.error).toBe('Invalid password');
  });

  it('calls logout and resets user', async () => {
    const mockAuthUser = {
      uid: 'user-123',
      email: 'admin@giotech.com',
    };

    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      (callback as (user: unknown) => void)(mockAuthUser);
      return vi.fn();
    });
    vi.mocked(onSnapshot).mockImplementation((_ref, callback) => {
      (callback as (snap: unknown) => void)({
        exists: () => true,
        data: () => ({ rol: 'admin' }),
      });
      return vi.fn();
    });
    vi.mocked(signOut).mockResolvedValue(undefined as never);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).not.toBeNull();

    await act(async () => {
      await result.current.logout();
    });

    expect(signOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });
});
