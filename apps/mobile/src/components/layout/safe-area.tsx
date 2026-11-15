import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

// Third-party native views need an explicit className-to-style adapter.
export const SafeAreaView = withUniwind(NativeSafeAreaView);
