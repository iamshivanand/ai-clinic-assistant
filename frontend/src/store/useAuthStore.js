import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      
      login: (userData, token) => {
        // userData should include the user info and clinic info
        set({ user: userData, token: token });
      },
      
      logout: () => {
        set({ user: null, token: null });
      },
      
      isAuthenticated: () => {
        const state = useAuthStore.getState();
        return !!state.token;
      },
      
      hasRole: (roles) => {
        const state = useAuthStore.getState();
        if (!state.user) return false;
        return roles.includes(state.user.role);
      }
    }),
    {
      name: 'auth-storage', // name of the item in storage (must be unique)
    }
  )
);

export default useAuthStore;
