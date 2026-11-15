import { LegalPage } from '@/components/legal/legal-page';
import { terms } from '@/legal/content';

export default function VilkaarScreen() {
  return <LegalPage doc={terms} />;
}
