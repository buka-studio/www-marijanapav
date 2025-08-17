export function track(event: string, properties: Record<string, any>) {
  if (typeof window === 'undefined') {
    return;
  }

  const umami = (window as any).umami;

  if (!umami) {
    return;
  }

  try {
    umami.track(event, properties);
  } catch (e) {
    console.error(e);
  }
}
