import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = process.env.TMDB_READ_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Missing TMDB_READ_ACCESS_TOKEN' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const language = searchParams.get('language') || 'en-US';
    const query = searchParams.get('query') || '';
    const year = searchParams.get('year') || '';
    const genre = searchParams.get('genre') || ''; // TMDB genre id
    const region = searchParams.get('region') || ''; // e.g., IN
    const wol = searchParams.get('wol') || ''; // with_original_language, e.g., hi/te/ta/ml/kn/mr/pa/bn

    let url: string;

    if (query) {
      const params = new URLSearchParams({
        language,
        page,
        include_adult: 'false',
        query,
      });
      if (year) params.set('year', year);
      if (region) params.set('region', region);
      url = `https://api.themoviedb.org/3/search/movie?${params.toString()}`; // search + year[16]
    } else {
      const params = new URLSearchParams({
        language,
        page,
        sort_by: 'popularity.desc',
        include_adult: 'false',
        include_video: 'false',
      });
      if (region) params.set('region', region); // regional release relevance[1]
      if (year) params.set('primary_release_year', year); // year filter[1]
      if (genre) params.set('with_genres', genre); // one or CSV ids[1]
      if (wol) params.set('with_original_language', wol); // original lang filter[1][4]
      url = `https://api.themoviedb.org/3/discover/movie?${params.toString()}`;
    }

    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      // cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    if (!r.ok) {
      let detail: unknown = null;
      try { detail = await r.clone().json(); } catch {}
      const text = detail || (await r.text());
      console.error('TMDB API Error:', r.status, text);
      return NextResponse.json({ results: [], error: 'TMDB error', detail: text }, { status: r.status });
    }

    const data = await r.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    console.error('Server error:', e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ results: [], error: 'Server error', detail: errorMessage }, { status: 500 });
  }
}
