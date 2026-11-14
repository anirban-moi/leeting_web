'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { updateUserProfile } from '../../lib/services/profile-service';

const AuthContext = createContext({
  user: null,
  clerkUser: null,
  isCloudConnected: false,
  isLoaded: false,
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const [profileSynced, setProfileSynced] = useState(false);

  const user = isSignedIn && clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        username:
          clerkUser.username ||
          clerkUser.firstName ||
          clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] ||
          'The-Boss',
        fullName: clerkUser.fullName || '',
        imageUrl: clerkUser.imageUrl,
      }
    : null;

  // Auto-sync / upsert profile in Supabase when signed in with Clerk
  useEffect(() => {
    if (isSignedIn && clerkUser && !profileSynced) {
      import('../../lib/services/profile-service').then(({ fetchUserProfile, updateUserProfile }) => {
        fetchUserProfile(clerkUser.id).then((existingProfile) => {
          const updates = {
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            display_name: clerkUser.fullName || clerkUser.firstName || 'Engineer',
            avatar_url: clerkUser.imageUrl || '',
          };
          // Only set default if user doesn't already have a custom leetcode username
          if (!existingProfile?.username || existingProfile.username === 'The-Boss') {
            updates.leetcode_username = existingProfile?.username || 'The-Boss';
          }
          updateUserProfile(clerkUser.id, updates).then(() => {
            setProfileSynced(true);
          });
        });
      });
    }
  }, [isSignedIn, clerkUser, profileSynced]);

  const signOut = async () => {
    if (clerkSignOut) {
      await clerkSignOut({ redirectUrl: '/' });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        clerkUser,
        isLoaded,
        isCloudConnected: Boolean(isSignedIn),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
