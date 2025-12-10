import { Play, CheckSquare, FileText, Zap, Flag, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const DraggableNode = ({ type, label, icon: Icon, color }: { type: string, label: string, icon: any, color: string }) => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 bg-card border-2 border-border cursor-grab active:cursor-grabbing hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_var(--color-border)] transition-all duration-200 group",
        "active:translate-y-[0px] active:shadow-none"
      )}
      onDragStart={(event) => onDragStart(event, type)}
      draggable
    >
      <div className={cn("p-2 border-2 border-border", color)}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1">
        <span className="font-mono text-xs font-bold uppercase block">{label}</span>
        <span className="text-[10px] text-muted-foreground">Drag to add</span>
      </div>
      <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

export function Sidebar() {
  return (
    <div className="w-[280px] bg-background border-r-2 border-border flex flex-col h-full z-10 shadow-[4px_0px_0px_0px_rgba(0,0,0,0.05)]">
      <div className="p-4 border-b-2 border-border bg-muted/30">
        <h1 className="font-bold text-xl tracking-tight flex items-center gap-2">
          <span className="w-3 h-3 bg-primary inline-block"></span>
          FLOWFORGE
        </h1>
        <p className="text-xs font-mono text-muted-foreground mt-1">HR WORKFLOW DESIGNER v1.0</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-3">
          <h3 className="font-mono text-xs font-bold uppercase text-muted-foreground pl-1">Flow Control</h3>
          <DraggableNode type="start" label="Start Event" icon={Play} color="bg-black" />
          <DraggableNode type="end" label="End Event" icon={Flag} color="bg-destructive" />
        </div>

        <div className="space-y-3">
          <h3 className="font-mono text-xs font-bold uppercase text-muted-foreground pl-1">Actions</h3>
          <DraggableNode type="task" label="Human Task" icon={CheckSquare} color="bg-primary" />
          <DraggableNode type="approval" label="Approval" icon={FileText} color="bg-blue-600" />
          <DraggableNode type="automated" label="System Action" icon={Zap} color="bg-yellow-500" />
        </div>
      </div>

      <div className="p-4 border-t-2 border-border bg-muted/30">
        <div className="text-[10px] font-mono text-muted-foreground">
          STATUS: <span className="text-green-600 font-bold">ONLINE</span>
          <br />
          MODE: <span className="text-primary font-bold">DESIGN</span>
        </div>
      </div>
    </div>
  );
}
