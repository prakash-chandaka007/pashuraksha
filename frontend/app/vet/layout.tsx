import Navbar from "@/components/Navbar";

export default function VetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
