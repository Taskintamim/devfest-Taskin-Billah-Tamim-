import { ActionBar } from "./components/ActionBar";
import { FilePanel } from "./components/FilePanel";
import { GenerationProgress, PackageReady } from "./components/PackageReady";
import { TenderPanel } from "./components/TenderPanel";
import { ToastStack } from "./components/ToastStack";
import { TopBar } from "./components/TopBar";
import { WorkflowStrip } from "./components/WorkflowStrip";

export default function App() {
  return (
    <div className="paper-grid h-dvh overflow-hidden text-ink">
      <div className="flex h-dvh flex-col bg-paper/80">
        <TopBar />
        <WorkflowStrip />
        <main className="mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 flex-col lg:flex-row">
          <TenderPanel />
          <FilePanel />
        </main>
        <ActionBar />
        <ToastStack />
        <GenerationProgress />
        <PackageReady />
      </div>
    </div>
  );
}
