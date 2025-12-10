import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useWorkflowStore } from '@/store/workflowStore';
import { X, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { useState } from 'react';
import { AutomationAction } from '@/types/workflow';

export function NodeConfigPanel() {
  const { selectedNodeId, nodes, updateNodeData, selectNode, deleteNode } = useWorkflowStore();
  const [actions, setActions] = useState<AutomationAction[]>([]);
  
  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  
  const { register, handleSubmit, reset, watch, setValue } = useForm();
  
  useEffect(() => {
    if (selectedNode) {
      reset(selectedNode.data);
    }
  }, [selectedNode, reset]);

  useEffect(() => {
    api.getAutomations().then(setActions);
  }, []);

  if (!selectedNode) return null;

  const onSubmit = (data: any) => {
    updateNodeData(selectedNode.id, data);
  };

  // Auto-save on change
  const handleFieldChange = (field: string, value: any) => {
    setValue(field, value);
    updateNodeData(selectedNode.id, { [field]: value });
  };

  return (
    <div className="h-full flex flex-col bg-background border-l-2 border-border w-[320px] shadow-[-4px_0px_0px_0px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <div className="p-4 border-b-2 border-border flex items-center justify-between bg-muted/30">
        <div className="flex flex-col">
          <span className="font-mono text-xs text-muted-foreground uppercase">Configuration</span>
          <h3 className="font-bold text-lg leading-none">{selectedNode.type} Node</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={() => selectNode(null)} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-2">
          <Label className="font-mono text-xs uppercase">Node Label</Label>
          <Input 
            {...register('label')} 
            onChange={(e) => handleFieldChange('label', e.target.value)}
            className="font-bold"
          />
        </div>

        {selectedNode.type === 'task' && (
          <>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase">Description</Label>
              <Textarea 
                {...register('description')}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                className="resize-none h-24"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase">Assignee</Label>
              <Input 
                {...register('assignee')}
                onChange={(e) => handleFieldChange('assignee', e.target.value)}
                placeholder="e.g. john.doe@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase">Due Date</Label>
              <Input 
                type="date"
                {...register('dueDate')}
                onChange={(e) => handleFieldChange('dueDate', e.target.value)}
              />
            </div>
          </>
        )}

        {selectedNode.type === 'approval' && (
          <>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase">Approver Role</Label>
              <Select 
                onValueChange={(val) => handleFieldChange('role', val)}
                value={watch('role')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Director">Director</SelectItem>
                  <SelectItem value="HRBP">HR Business Partner</SelectItem>
                  <SelectItem value="VP">VP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase">Auto-Approve Threshold ($)</Label>
              <Input 
                type="number"
                {...register('threshold')}
                onChange={(e) => handleFieldChange('threshold', e.target.value)}
              />
            </div>
          </>
        )}

        {selectedNode.type === 'automated' && (
          <>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase">Action</Label>
              <Select 
                onValueChange={(val) => handleFieldChange('actionId', val)}
                value={watch('actionId')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {actions.map(action => (
                    <SelectItem key={action.id} value={action.id}>
                      <div className="flex items-center gap-2">
                        <span>{action.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Dynamic Params */}
            {watch('actionId') && (
              <div className="p-3 bg-secondary border border-border space-y-3">
                <span className="font-mono text-[10px] uppercase text-muted-foreground block mb-2">Action Parameters</span>
                {actions.find(a => a.id === watch('actionId'))?.params.map(param => (
                  <div key={param} className="space-y-1">
                    <Label className="text-xs capitalize">{param}</Label>
                    <Input 
                      placeholder={`Enter ${param}...`}
                      className="h-8 text-xs bg-background"
                      onChange={(e) => {
                        const currentParams = watch('actionParams') || {};
                        handleFieldChange('actionParams', { ...currentParams, [param]: e.target.value });
                      }}
                      value={watch('actionParams')?.[param] || ''}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {selectedNode.type === 'end' && (
          <>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase">End Message</Label>
              <Textarea 
                {...register('endMessage')}
                onChange={(e) => handleFieldChange('endMessage', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 border border-border p-3 bg-secondary">
              <input 
                type="checkbox" 
                id="isSummary"
                {...register('isSummary')}
                onChange={(e) => handleFieldChange('isSummary', e.target.checked)}
                className="w-4 h-4 rounded-none border-2 border-border text-primary focus:ring-0"
              />
              <Label htmlFor="isSummary" className="font-mono text-xs uppercase cursor-pointer">Generate Summary Report</Label>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t-2 border-border bg-muted/30 flex gap-2">
        <Button 
          variant="destructive" 
          className="w-full"
          onClick={() => deleteNode(selectedNode.id)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Node
        </Button>
      </div>
    </div>
  );
}
