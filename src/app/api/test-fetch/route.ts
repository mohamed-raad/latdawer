import { NextResponse } from 'next/server'

export async function GET() {
  const tests = [
    { name: 'Wikipedia', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Toyota_logo.svg/512px-Toyota_logo.svg.png' },
    { name: 'WorldVectorLogo', url: 'https://cdn.worldvectorlogo.com/logos/toota-4.svg' },
    { name: 'CarParts', url: 'https://www.carparts.com/blog/wp-content/uploads/2022/01/car-alternator.jpg' },
  ]
  
  const results = []
  for (const test of tests) {
    try {
      const res = await fetch(test.url, { method: 'HEAD' })
      results.push({ name: test.name, ok: res.ok, status: res.status })
    } catch (e) {
      results.push({ name: test.name, error: e instanceof Error ? e.message : 'unknown' })
    }
  }
  return NextResponse.json(results)
}
