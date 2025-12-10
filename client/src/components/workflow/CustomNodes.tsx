import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { WorkflowNodeData } from '@/types/workflow';
import { Play, CheckSquare, FileText, Zap, Flag, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const NodeWrapper = ({ 
  children, 
  selected, 
  type,
  label,
  icon: Icon
}: { 
  children?: React.ReactNode; 
  selected?: boolean; 
  type: string;
  label: string;
  icon: any;
}) => {
  return (
    <div className={cn(
      "relative min-w-[200px] bg-card border-2 border-border shadow-[4px_4px_0px_0px_var(--color-border)] transition-all duration-200",
      selected && "translate-y-[-2px] shadow-[6px_6px_0px_0px_var(--color-primary)] border-primary",
      "group"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 border-b-2 border-border bg-muted/50",
        selected && "bg-primary/10 border-primary"
      )}>
        <Icon className="w-4 h-4" />
        <span className="font-mono text-xs font-bold uppercase tracking-wider">{type}</span>
      </div>
      
      {/* Body */}
      <div className="p-3">
        <div className="font-bold text-sm mb-1 line-clamp-2">{label}</div>
        {children}
      </div>

      {/* Handles */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-background !border-2 !border-border !rounded-none hover:!bg-primary transition-colors" 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !bg-background !border-2 !border-border !rounded-none hover:!bg-primary transition-colors" 
      />
    </div>
  );
};

export const StartNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <NodeWrapper type="Start" label={data.label} icon={Play} selected={selected}>
      <div className="text-xs text-muted-foreground">Workflow Entry Point</div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-background !border-2 !border-border !rounded-none" />
    </NodeWrapper>
  );
});

export const TaskNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <NodeWrapper type="Task" label={data.label} icon={CheckSquare} selected={selected}>
      {data.assignee && (
        <div className="mt-2 text-xs flex items-center gap-1 bg-secondary p-1 border border-border">
          <span className="font-mono text-[10px] text-muted-foreground">USER:</span>
          <span className="font-bold truncate">{data.assignee}</span>
        </div>
      )}
    </NodeWrapper>
  );
});

export const ApprovalNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <NodeWrapper type="Approval" label={data.label} icon={FileText} selected={selected}>
      {data.role && (
        <div className="mt-2 text-xs flex items-center gap-1 bg-secondary p-1 border border-border">
          <span className="font-mono text-[10px] text-muted-foreground">ROLE:</span>
          <span className="font-bold truncate">{data.role}</span>
        </div>
      )}
    </NodeWrapper>
  );
});

export const AutomatedNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <NodeWrapper type="Auto" label={data.label} icon={Zap} selected={selected}>
      {data.actionId && (
        <div className="mt-2 text-xs flex items-center gap-1 bg-secondary p-1 border border-border">
          <span className="font-mono text-[10px] text-muted-foreground">ACT:</span>
          <span className="font-bold truncate">{data.actionId}</span>
        </div>
      )}
    </NodeWrapper>
  );
});

export const EndNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <NodeWrapper type="End" label={data.label} icon={Flag} selected={selected}>
      <div className="text-xs text-muted-foreground">Workflow Completion</div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-background !border-2 !border-border !rounded-none" />
    </NodeWrapper>
  );
});
