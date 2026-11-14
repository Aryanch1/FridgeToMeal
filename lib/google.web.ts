import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { auth } from './firebase';

/** Web: Firebase's own Google popup flow. */
export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(auth, new GoogleAuthProvider());
}
