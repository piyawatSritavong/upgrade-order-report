import DashboardClient from '@/app/page/DashboardClient';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-black mb-8 text-gray-800">Order Report</h1>
        <DashboardClient />
      </div>
    </div>
  );
}