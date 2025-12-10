import { useState } from 'react';
import { useWorkflowStore } from '@/store/workflowStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, Terminal, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { SimulationResult } from '@/types/workflow';
import { cn } from '@/lib/utils';

export function SimulationPanel() {
  const { nodes, edges, validateWorkflow } = useWorkflowStore();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const runSimulation = async () => {
    if (!validateWorkflow()) {
      setLogs(prev => [...prev, 'ERROR: Invalid workflow structure. Missing Start or End node.']);
      return;
    }

    setIsRunning(true);
    setLogs(['Initializing simulation environment...', 'Validating graph topology...']);
    setResult(null);

    try {
      const simResult = await api.simulateWorkflow(nodes, edges);
      setResult(simResult);
      
      if (simResult.success) {
        simResult.steps.forEach((step, index) => {
          setTimeout(() => {
            setLogs(prev => [...prev, ...step.logs]);
          }, index * 500);
        });
        setTimeout(() => {
          setLogs(prev => [...prev, 'Workflow execution completed successfully.']);
        }, simResult.steps.length * 500);
      } else {
        setLogs(prev => [...prev, `ERROR: ${simResult.finalOutput?.error || 'Unknown error'}`]);
      }
    } catch (error) {
      setLogs(prev => [...prev, 'CRITICAL FAILURE: Simulation crashed.']);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[600px] bg-card border-2 border-border shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] z-50 flex flex-col max-h-[300px]">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b-2 border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <span className="font-mono text-xs font-bold uppercase">Workflow Simulator</span>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7 text-xs border-2"
            onClick={() => {
              setLogs([]);
              setResult(null);
            }}
          >
            <RotateCcw className="w-3 h-3 mr-1" /> Clear
          </Button>
          <Button 
            size="sm" 
            className="h-7 text-xs bg-green-600 hover:bg-green-700 border-2 border-green-900 text-white"
            onClick={runSimulation}
            disabled={isRunning}
          >
            {isRunning ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
            {isRunning ? 'Running...' : 'Run Simulation'}
          </Button>
        </div>
      </div>

      {/* Console Output */}
      <div className="flex-1 bg-black p-4 overflow-y-auto font-mono text-xs text-green-400 min-h-[150px]">
        {logs.length === 0 && (
          <div className="text-gray-600 italic">Ready to simulate. Press Run to start...</div>
        )}
        {logs.map((log, i) => (
          <div key={i} className="mb-1 flex gap-2">
            <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>
            <span>{log}</span>
          </div>
        ))}
        {result && (
          <div className={cn(
            "mt-4 p-2 border border-dashed",
            result.success ? "border-green-500 text-green-500" : "border-red-500 text-red-500"
          )}>
            <div className="font-bold flex items-center gap-2">
              {result.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {result.success ? 'SUCCESS' : 'FAILED'}
            </div>
            {result.finalOutput && (
              <pre className="mt-2 text-[10px] opacity-80">
                {JSON.stringify(result.finalOutput, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
