import { AutomationAction, SimulationResult, WorkflowNode, WorkflowEdge } from '@/types/workflow';
import { v4 as uuidv4 } from 'uuid';

// Mock Automation Actions
const MOCK_ACTIONS: AutomationAction[] = [
  { id: 'send_email', label: 'Send Email', params: ['to', 'subject', 'body'], icon: 'mail' },
  { id: 'generate_doc', label: 'Generate Document', params: ['template', 'recipient'], icon: 'file-text' },
  { id: 'slack_notify', label: 'Slack Notification', params: ['channel', 'message'], icon: 'message-square' },
  { id: 'update_hrt', label: 'Update HRIS', params: ['employee_id', 'field', 'value'], icon: 'database' },
  { id: 'schedule_meeting', label: 'Schedule Meeting', params: ['attendees', 'duration', 'topic'], icon: 'calendar' },
];

export const api = {
  getAutomations: async (): Promise<AutomationAction[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_ACTIONS;
  },

  simulateWorkflow: async (nodes: WorkflowNode[], edges: WorkflowEdge[]): Promise<SimulationResult> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const steps = [];
    const sortedNodes = topologicalSort(nodes, edges);
    
    if (!sortedNodes) {
      return {
        success: false,
        steps: [],
        finalOutput: { error: 'Cycle detected in workflow' }
      };
    }

    for (const node of sortedNodes) {
      steps.push({
        id: uuidv4(),
        nodeId: node.id,
        status: 'completed',
        timestamp: Date.now(),
        logs: [`Executed node: ${node.data.label} (${node.type})`],
        output: { processed: true }
      });
      
      // Simulate processing time per node
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    return {
      success: true,
      steps: steps as any,
      finalOutput: { message: 'Workflow completed successfully' }
    };
  }
};

// Helper for sorting nodes execution order
function topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] | null {
  const adjacencyList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  
  nodes.forEach(node => {
    adjacencyList.set(node.id, []);
    inDegree.set(node.id, 0);
  });
  
  edges.forEach(edge => {
    if (adjacencyList.has(edge.source) && inDegree.has(edge.target)) {
      adjacencyList.get(edge.source)?.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }
  });
  
  const queue: string[] = [];
  inDegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id);
  });
  
  const result: WorkflowNode[] = [];
  
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodes.find(n => n.id === nodeId);
    if (node) result.push(node);
    
    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }
  
  if (result.length !== nodes.length) return null; // Cycle detected
  return result;
}
