import { ActionBar } from "./components/ActionBar";
import { FilePanel } from "./components/FilePanel";
import { TenderPanel } from "./components/TenderPanel";
import { ToastStack } from "./components/ToastStack";
import { TopBar } from "./components/TopBar";
import { WorkflowStrip } from "./components/WorkflowStrip";

export default function App() {
  return (
    <div className="paper-grid min-h-screen text-ink">
      <div className="flex min-h-screen flex-col bg-paper/80">
        <TopBar />
        <WorkflowStrip />
        <main className="mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 flex-col lg:flex-row">
          <TenderPanel />
          <FilePanel />
        </main>
        <ActionBar />
        <ToastStack />
      </div>
    </div>
  );
}
