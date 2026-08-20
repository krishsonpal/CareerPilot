import React from "react";
import ApplicationCard from "./ApplicationCard";

const KanbanColumn = ({
  title,
  count = 0,
  colorClass = "bg-primary/10 text-primary",
  items = [],
  onSelectCard,
}) => {
  return (
    <div className="bg-muted/40 rounded-2xl p-3 sm:p-4 border border-border flex flex-col min-h-[500px]">
      
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          <span className={`text-xs font-black px-2 py-0.5 rounded-full border border-border ${colorClass}`}>
            {count}
          </span>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
        {items.length === 0 ? (
          <div className="h-44 border-2 border-dashed border-border rounded-xl flex items-center justify-center text-center p-4">
            <span className="text-xs text-muted-foreground font-medium">
              No applications in {title.toLowerCase()}
            </span>
          </div>
        ) : (
          items.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onSelect={onSelectCard}
            />
          ))
        )}
      </div>

    </div>
  );
};

export default KanbanColumn;
