import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://us-central1-mobile-assignment-server.cloudfunctions.net/weather');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
} 