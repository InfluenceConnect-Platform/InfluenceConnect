import Sidebar from './Sidebar';
import Header from './Header';

type Props = {
  children: React.ReactNode;
};

export default function DashboardShell({ children }: Props) {
  return (
    <div className="flex h-screen bg-brand-50 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}