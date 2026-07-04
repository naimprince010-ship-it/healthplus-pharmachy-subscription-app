import { NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Note: Ensure @google-analytics/data is installed

// Allow Next.js to evaluate this dynamically
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Note: We can add auth checks here later using Next-Auth if needed.
    // For now, it's accessible within the admin panel.

    // 2. Check if Env vars are set
    const propertyId = process.env.GA_PROPERTY_ID;
    const clientEmail = process.env.GA_CLIENT_EMAIL;
    const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!propertyId || !clientEmail || !privateKey) {
      return NextResponse.json(
        { error: 'Google Analytics credentials are not configured in .env' },
        { status: 500 }
      );
    }

    // 3. Initialize GA4 Client
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
    });

    // Parse URL parameters for date range and path
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') || '30daysAgo';
    const endDate = url.searchParams.get('endDate') || 'today';
    const pathFilter = url.searchParams.get('pathFilter') || '/delivery/';

    // 4. Fetch Data from GA4
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: [
        { name: 'city' },
        { name: 'pagePath' },
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'activeUsers' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'BEGINS_WITH',
            value: pathFilter,
          },
        },
      },
      orderBys: [
        {
          metric: { metricName: 'screenPageViews' },
          desc: true,
        },
      ],
      limit: 50,
    });

    // 5. Format Data
    const data = response.rows?.map(row => ({
      city: row.dimensionValues?.[0]?.value || 'Unknown',
      path: row.dimensionValues?.[1]?.value || '',
      views: parseInt(row.metricValues?.[0]?.value || '0', 10),
      users: parseInt(row.metricValues?.[1]?.value || '0', 10),
    })) || [];

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('GA4 API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data', details: error.message },
      { status: 500 }
    );
  }
}
