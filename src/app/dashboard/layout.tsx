import { DashboardLayout } from "@/components/layout";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Get user from auth context/session
  const mockUser = {
    name: "Sarah Johnson",
    email: "sarah@company.com",
    role: "sales_rep" as const,
  };

  return <DashboardLayout user={mockUser}>{children}</DashboardLayout>;
}
