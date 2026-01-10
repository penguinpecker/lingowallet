import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let text = '';
  
  try {
    const body = await request.json();
    text = body.text;
    const targetLang = body.targetLang;

    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    
    if (!apiKey) {
      console.log('No Google Translate API key - returning original text');
      return NextResponse.json({ 
        translatedText: text,
        note: 'Add GOOGLE_TRANSLATE_API_KEY to enable translation' 
      });
    }

    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLang,
        format: 'text',
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    return NextResponse.json({ 
      translatedText: data.data.translations[0].translatedText,
      originalLanguage: data.data.translations[0].detectedSourceLanguage
    });

  } catch (error: any) {
    console.error('Translation error:', error);
    return NextResponse.json({ 
      translatedText: text || '',
      error: error.message 
    }, { status: 500 });
  }
}