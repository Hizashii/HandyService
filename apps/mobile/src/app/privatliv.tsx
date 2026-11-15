import { LegalPage } from '@/components/legal/legal-page';
import { privacy } from '@/legal/content';

export default function PrivatlivScreen() {
  return <LegalPage doc={privacy} />;
}
