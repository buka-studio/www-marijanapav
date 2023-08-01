import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET() {
  const cookieStore = cookies();
  cookieStore.set('notrack', 'true');

  redirect('/');
}
