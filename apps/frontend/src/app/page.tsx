import { redirect } from 'next/navigation';

export default function RootPage() {
  // Use a proper Server-Side Redirect for Vercel/Production stability
  redirect('/enterprise');
}