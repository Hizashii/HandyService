import { LegalPage } from '@/components/legal/legal-page';
import { cookies } from '@/legal/content';

export default function CookiesScreen() {
  return <LegalPage doc={cookies} />;
}
