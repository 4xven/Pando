import Sidebar from "./components/sidebar";
import Header from "./components/header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
   <div className="flex min-h-screen bg-[#F5F5F5] overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Right Section */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="p-6 flex-1">{children}</main>
      </div>
    </div>
  );
}