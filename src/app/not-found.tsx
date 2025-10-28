import Link from 'next/link';

import Button from '../components/ui/Button';
import Heading from '../components/ui/Heading';
import Header from './(main)/components/Header';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center px-11 py-10">
        <Heading className="mb-6 text-6xl  md:mb-10 md:text-9xl">404</Heading>
        <p className="mb-4 md:mb-6">Oops! Page not found.</p>
        <Button asChild>
          <Link href="/">Go Back to Home</Link>
        </Button>
      </main>
    </>
  );
}
