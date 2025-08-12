import { getClient } from '@umami/api-client';

export const createClient = () => {
  const apiKey = process.env.UMAMI_API_KEY;
  const websiteId = process.env.UMAMI_WEBSITE_ID;

  if (!apiKey || !websiteId) {
    throw new Error('Missing Umami credentials');
  }

  const client = getClient({
    apiKey,
  });

  return client;
};

export const fetchWebsiteStats = async () => {
  const client = createClient();

  const startsAtOneWeekAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).getTime();
  const endAtNow = new Date().getTime();

  const stats = await client.getWebsiteStats(process.env.UMAMI_WEBSITE_ID!, {
    startAt: startsAtOneWeekAgo,
    endAt: endAtNow,
  });

  return stats;
};
