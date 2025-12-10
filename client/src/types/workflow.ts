import { Node, Edge } from 'reactflow';

export type WorkflowNodeType = 'start' | 'task' | 'approval' | 'automated' | 'end';

export interface WorkflowNodeData {
  label: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  role?: string;
  threshold?: number;
  actionId?: string;
  actionParams?: Record<string, any>;
  endMessage?: string;
  isSummary?: boolean;
  metadata?: Record<string, string>;
  customFields?: Record<string, string>;
  // Validation state
  isValid?: boolean;
  errors?: string[];
}

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;

export interface AutomationAction {
  id: string;
  label: string;
  params: string[];
  icon?: string;
}

export interface WorkflowValidationResult {
  isValid: boolean;
  errors: {
    nodeId?: string;
    message: string;
    type: 'error' | 'warning';
  }[];
}

export interface SimulationStep {
  id: string;
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: any;
  timestamp: number;
  logs: string[];
}

export interface SimulationResult {
  success: boolean;
  steps: SimulationStep[];
  finalOutput?: any;
}
