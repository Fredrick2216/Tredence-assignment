import { create } from 'zustand';
import { 
  Connection, 
  Edge, 
  EdgeChange, 
  Node, 
  NodeChange, 
  addEdge, 
  OnNodesChange, 
  OnEdgesChange, 
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges
} from 'reactflow';
import { WorkflowNode, WorkflowNodeData } from '@/types/workflow';

interface WorkflowState {
  nodes: WorkflowNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  
  addNode: (type: string, position: { x: number, y: number }) => void;
  updateNodeData: (id: string, data: Partial<WorkflowNodeData>) => void;
  selectNode: (id: string | null) => void;
  deleteNode: (id: string) => void;
  
  // Validation
  validateWorkflow: () => boolean;
}

const initialNodes: WorkflowNode[] = [
  {
    id: 'start-1',
    type: 'start',
    position: { x: 100, y: 100 },
    data: { label: 'Start Workflow' }
  }
];

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: initialNodes,
  edges: [],
  selectedNodeId: null,

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes)
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges)
    });
  },

  onConnect: (connection: Connection) => {
    set({
      edges: addEdge({ ...connection, type: 'smoothstep', animated: true, style: { stroke: '#1A1A1A', strokeWidth: 2 } }, get().edges)
    });
  },

  addNode: (type: string, position: { x: number, y: number }) => {
    const id = `${type}-${Date.now()}`;
    const newNode: WorkflowNode = {
      id,
      type,
      position,
      data: { 
        label: type.charAt(0).toUpperCase() + type.slice(1),
        description: 'New node'
      }
    };
    
    set({ nodes: [...get().nodes, newNode] });
  },

  updateNodeData: (id: string, data: Partial<WorkflowNodeData>) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      })
    });
  },

  selectNode: (id: string | null) => {
    set({ selectedNodeId: id });
  },

  deleteNode: (id: string) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
      edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId
    });
  },

  validateWorkflow: () => {
    // Basic validation logic
    const { nodes, edges } = get();
    const hasStart = nodes.some(n => n.type === 'start');
    const hasEnd = nodes.some(n => n.type === 'end');
    
    // Check for disconnected nodes
    // This is a simplified check
    return hasStart && hasEnd;
  }
}));
