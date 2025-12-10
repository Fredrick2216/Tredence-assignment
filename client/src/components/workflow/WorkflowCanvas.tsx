import { useCallback, useRef } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  Panel
} from 'reactflow';
import { useWorkflowStore } from '@/store/workflowStore';
import { StartNode, TaskNode, ApprovalNode, AutomatedNode, EndNode } from './CustomNodes';
import { Button } from '@/components/ui/button';
import { Plus, Play, Download, Upload } from 'lucide-react';
import { useDrop } from 'react-dnd';

const nodeTypes = {
  start: StartNode,
  task: TaskNode,
  approval: ApprovalNode,
  automated: AutomatedNode,
  end: EndNode,
};

function Flow() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect,
    addNode,
    selectNode
  } = useWorkflowStore();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      
      if (!reactFlowBounds) return;

      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      addNode(type, position);
    },
    [project, addNode]
  );

  return (
    <div className="w-full h-full bg-[#F8F8F8] dark:bg-[#121212]" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#1A1A1A', strokeWidth: 2 },
        }}
      >
        <Background color="#ccc" gap={20} size={1} />
        <Controls className="!bg-card !border-2 !border-border !shadow-[4px_4px_0px_0px_var(--color-border)] !rounded-none [&>button]:!rounded-none [&>button]:!border-b-2 [&>button]:!border-border last:[&>button]:!border-b-0 hover:[&>button]:!bg-muted" />
        <MiniMap 
          className="!bg-card !border-2 !border-border !shadow-[4px_4px_0px_0px_var(--color-border)] !rounded-none"
          maskColor="rgba(240, 240, 240, 0.6)"
          nodeColor={(n) => {
            if (n.type === 'start') return '#1A1A1A';
            if (n.type === 'end') return '#FF3333';
            return '#FF5F1F';
          }}
        />
        
        <Panel position="top-right" className="flex gap-2">
          <div className="bg-card border-2 border-border p-2 shadow-[4px_4px_0px_0px_var(--color-border)] flex gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs gap-2">
              <Download className="w-3 h-3" /> Export
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-2">
              <Upload className="w-3 h-3" /> Import
            </Button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
