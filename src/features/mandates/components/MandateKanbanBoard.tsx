"use client";

import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { stageLabel } from "@/lib/helpers";

const PIPELINE_STAGES = [
  "universe", "mapping", "longlist", "calllist", "shortlist", "interview", "offer-sent", "offer-accepted", "closed",
];

export default function MandateKanbanBoard({ 
  candidates, 
  onDragEnd 
}: { 
  candidates: any[]; 
  onDragEnd: (candId: string, newStage: string) => void;
}) {
  const [localCands, setLocalCands] = useState(candidates);

  // Sync when parent updates
  React.useEffect(() => {
    setLocalCands(candidates);
  }, [candidates]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const newStage = destination.droppableId;
    
    // Optimistic update
    setLocalCands(prev => prev.map(c => 
      c.id.toString() === draggableId ? { ...c, stage: newStage } : c
    ));

    // Call parent handler
    onDragEnd(draggableId, newStage);
  };

  const candsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage] = localCands.filter(c => (c.stage || 'universe') === stage);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 px-2 min-h-[500px]">
        {PIPELINE_STAGES.map(stage => (
          <Droppable key={stage} droppableId={stage}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-shrink-0 w-[280px] bg-gray-50 rounded-xl border border-gray-200 flex flex-col max-h-[800px] ${
                  snapshot.isDraggingOver ? 'bg-blue-50/50 border-blue-200' : ''
                }`}
              >
                <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-xl">
                  <h4 className="font-bold text-gray-700 text-sm">{stageLabel(stage)}</h4>
                  <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full">
                    {candsByStage[stage].length}
                  </span>
                </div>
                
                <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3 min-h-[150px]">
                  {candsByStage[stage].map((c, index) => (
                    <Draggable key={c.id.toString()} draggableId={c.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-white p-3 rounded-lg border shadow-sm ${
                            snapshot.isDragging ? 'shadow-md border-[#133255] rotate-2' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded bg-[#133255] text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {c.initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-gray-900 text-sm truncate" title={c.name}>{c.name}</div>
                              <div className="text-[11px] text-gray-500 truncate" title={c.role + ' - ' + c.company}>{c.role} - {c.company}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                            {c.score ? (
                              <div className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${c.score >= 8 ? 'bg-green-500' : c.score >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                                Score: {c.score}/10
                              </div>
                            ) : (
                              <div className="text-[10px] text-gray-400">Unassessed</div>
                            )}
                            
                            {c.hasReport && (
                              <div className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">
                                Report
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
