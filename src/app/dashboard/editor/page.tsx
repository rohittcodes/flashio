import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CodeEditor from '@/components/editor/CodeEditor';

export default function EditorPage() {
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)]">
        <CodeEditor />
      </div>
    </DashboardLayout>
  );
}
