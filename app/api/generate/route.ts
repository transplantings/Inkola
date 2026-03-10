import { NextResponse } from 'next/server'

const LEONARDO_API_URL = 'https://cloud.leonardo.ai/api/rest/v1/generations-lcm'

export async function POST(request: Request) {
  const apiKey = process.env.LEONARDO_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'LEONARDO_API_KEY not configured' }, { status: 500 })
  }

  let body: {
    imageBase64: string
    stylePrompt: string
    strength: number
    guidanceScale: number
    leonardoStyle?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { imageBase64, stylePrompt, strength, guidanceScale, leonardoStyle } = body

  if (!imageBase64 || !stylePrompt) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const res = await fetch(LEONARDO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        imageDataUrl: imageBase64,
        prompt: stylePrompt,
        strength: Math.min(1, Math.max(0.1, strength ?? 0.5)),
        guidance: Math.min(20, Math.max(0.5, guidanceScale ?? 7)),
        style: leonardoStyle || 'NONE',
        steps: 8,
        width: 512,
        height: 512,
        requestTimestamp: Date.now(),
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Leonardo API error:', res.status, errText)
      return NextResponse.json({ error: `Leonardo error: ${res.status}` }, { status: 500 })
    }

    const data = await res.json()
    console.log('Leonardo response keys:', Object.keys(data))

    const imageDataUrl = data?.lcmGenerationJob?.imageDataUrl?.[0]
    if (!imageDataUrl) {
      console.error('Unexpected Leonardo response:', JSON.stringify(data).slice(0, 500))
      return NextResponse.json({ error: 'No image in Leonardo response' }, { status: 500 })
    }

    return NextResponse.json({ imageUrl: imageDataUrl })
  } catch (err) {
    console.error('Leonardo error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
