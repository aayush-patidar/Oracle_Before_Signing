import EnterpriseLayout from '@/components/EnterpriseLayout';
import { Web3Provider } from '@/context/Web3Context';
import { RoleProvider } from '@/context/RoleContext';
import { PolicyProvider } from '@/context/PolicyContext';
import { Toaster } from 'sonner';

export default function EnterpriseMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Web3Provider>
      <RoleProvider>
        <PolicyProvider>
          <Toaster position="top-right" />
          <EnterpriseLayout>{children}</EnterpriseLayout>
        </PolicyProvider>
      </RoleProvider>
    </Web3Provider>
  );
}
