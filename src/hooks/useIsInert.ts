import { useEffect, useState, type RefObject } from 'react';

// whether the element is behind a modal (in an `inert` part of the page)
export default function useIsInert(ref: RefObject<Element | null>) {
  const [inert, setInert] = useState(false);

  useEffect(() => {
    const check = () => setInert(Boolean(ref.current?.closest('[inert]')));
    const observer = new MutationObserver(check);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['inert'],
      subtree: true,
    });
    check();

    return () => observer.disconnect();
  }, [ref]);

  return inert;
}
