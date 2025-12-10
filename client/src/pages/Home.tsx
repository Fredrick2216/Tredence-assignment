import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas';
import { Sidebar } from '@/components/workflow/Sidebar';
import { NodeConfigPanel } from '@/components/workflow/NodeConfigPanel';
import { SimulationPanel } from '@/components/workflow/SimulationPanel';
import { useWorkflowStore } from '@/store/workflowStore';

export default function Home() {
  const { selectedNodeId } = useWorkflowStore();

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen w-screen flex overflow-hidden bg-background text-foreground font-sans">
        {/* Left Sidebar - Tools */}
        <Sidebar />
        
        {/* Main Canvas Area */}
        <div className="flex-1 relative h-full">
          <WorkflowCanvas />
          
          {/* Floating Simulation Panel */}
          <SimulationPanel />
        </div>

        {/* Right Sidebar - Configuration (Conditional) */}
        {selectedNodeId && (
          <div className="animate-in slide-in-from-right duration-300">
            <NodeConfigPanel />
          </div>
        )}
      </div>
    </DndProvider>
  );
}
