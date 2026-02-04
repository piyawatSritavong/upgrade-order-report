import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
  const { searchParams} = new URL(req.url);

  try {
    const url = new URL(`${base}/orders`);
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
    
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error fetching orders:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } 
} 