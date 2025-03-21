import { setupServer } from 'msw/node';
import { rest, RestRequest, ResponseComposition, RestContext } from 'msw';

const mockWeatherData = {
  city: {
    name: 'London',
    picture: 'https://example.com/london.jpg',
  },
  temp: '20',
  tempType: 'C',
  date: new Date().toISOString(),
  isHidden: false,
};

const mockSearchResults = [
  {
    city: {
      name: 'London',
      picture: 'https://example.com/london.jpg',
    },
    temp: '20',
    tempType: 'C',
    date: new Date().toISOString(),
    isHidden: false,
  },
  {
    city: {
      name: 'London, KY',
      picture: 'https://example.com/london-ky.jpg',
    },
    temp: '25',
    tempType: 'C',
    date: new Date().toISOString(),
    isHidden: false,
  },
];

export const handlers = [
  // Mock weather data endpoint
  rest.get(`${process.env.NEXT_PUBLIC_WEATHER_API_URL}/weather`, (
    req: RestRequest,
    res: ResponseComposition,
    ctx: RestContext
  ) => {
    const query = req.url.searchParams.get('q');
    
    if (query === 'error') {
      return res(
        ctx.status(500),
        ctx.json({ message: 'Internal server error' })
      );
    }

    return res(
      ctx.status(200),
      ctx.json(mockWeatherData)
    );
  }),

  // Mock city search endpoint
  rest.get(`${process.env.NEXT_PUBLIC_WEATHER_API_URL}/find`, (
    req: RestRequest,
    res: ResponseComposition,
    ctx: RestContext
  ) => {
    const query = req.url.searchParams.get('q');
    
    if (query === 'error') {
      return res(
        ctx.status(500),
        ctx.json({ message: 'Internal server error' })
      );
    }

    return res(
      ctx.status(200),
      ctx.json(mockSearchResults)
    );
  }),
];

export const server = setupServer(...handlers); 