import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth, GOOGLE_WEB_CLIENT_ID, GoogleAuthProvider, signInWithCredential } from './firebase';


GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });

/**
 * Native (Android/iOS): the Google Sign-In sheet returns an ID token,
 * which is exchanged for a Firebase session — the standard
 * Firebase + GoogleSignin pairing.
 */
export async function signInWithGoogle(): Promise<void> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (response.type === 'cancelled') {
    throw new Error('Sign-in was cancelled.');
  }
  const idToken =
    response.data?.idToken ??
    (response as unknown as { idToken?: string | null }).idToken ??
    null;
  if (!idToken) {
    throw new Error('Google did not return an ID token.');
  }
  await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
}
