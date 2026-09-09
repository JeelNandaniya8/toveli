import SocialApp from '@/components/social/social-app';
import type { View } from '@/lib/social/types';
export default function Toveli({ initialView = 'feed', chatId }: { initialView?: View; chatId?: string }) {
  return <SocialApp initialView={initialView} chatId={chatId}/>;
}
