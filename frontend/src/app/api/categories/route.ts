import { NextResponse } from "next/server";

export const GET = async() => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
  
  try {
    const res = await fetch(`${base}/categories`);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error fetching categories:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}