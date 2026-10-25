// Server-side permanent redirect — no client component needed at root.
// This avoids React/webpack hydration on the entry path entirely.
import { permanentRedirect } from 'next/navigation';

export default function IndexPage() {
  permanentRedirect('/home');
}
