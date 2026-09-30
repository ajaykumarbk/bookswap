import http from 'http';
import https from 'https';

export interface ISBNBookMetadata {
  title: string;
  author: string;
  publisher?: string;
  publication_year?: number;
  cover_image?: string;
  description?: string;
  genre?: string;
}

export async function fetchBookMetadataByISBN(isbn: string): Promise<ISBNBookMetadata | null> {
  const cleanIsbn = isbn.replace(/[^0-9X]/gi, '');
  if (!cleanIsbn) return null;

  try {
    // Try OpenLibrary API first
    const openLibUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&jscmd=data&format=json`;
    const openLibData = await fetchJson(openLibUrl);
    const key = `ISBN:${cleanIsbn}`;

    if (openLibData && openLibData[key]) {
      const b = openLibData[key];
      return {
        title: b.title || 'Unknown Title',
        author: b.authors ? b.authors.map((a: any) => a.name).join(', ') : 'Unknown Author',
        publisher: b.publishers ? b.publishers.map((p: any) => p.name).join(', ') : '',
        publication_year: b.publish_date ? parseInt(b.publish_date.match(/\d{4}/)?.[0] || '2024') : undefined,
        cover_image: b.cover?.large || b.cover?.medium || `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`,
        description: typeof b.notes === 'string' ? b.notes : (b.subtitle || ''),
        genre: b.subjects ? b.subjects[0]?.name : 'General',
      };
    }

    // Fallback to Google Books API
    const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`;
    const googleData = await fetchJson(googleUrl);
    if (googleData && googleData.items && googleData.items.length > 0) {
      const volume = googleData.items[0].volumeInfo;
      return {
        title: volume.title || 'Unknown Title',
        author: volume.authors ? volume.authors.join(', ') : 'Unknown Author',
        publisher: volume.publisher || '',
        publication_year: volume.publishedDate ? parseInt(volume.publishedDate.substring(0, 4)) : undefined,
        cover_image: volume.imageLinks?.thumbnail || volume.imageLinks?.smallThumbnail || `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`,
        description: volume.description || '',
        genre: volume.categories ? volume.categories[0] : 'General',
      };
    }
  } catch (err) {
    console.error('Error fetching ISBN metadata:', err);
  }

  return null;
}

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', (err) => resolve(null));
  });
}
