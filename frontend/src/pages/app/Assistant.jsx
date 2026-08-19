import React from "react";
import { Sparkles, MessageSquare } from "lucide-react";
import EmbeddedChatbot from "../../components/EmbeddedChatbot";

const Assistant = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="text-indigo-600" />
            AI Career Assistant
          </h1>
          <p className="text-sm text-slate-500">
            Real-time streaming career coach powered by LangChain and Socket.IO.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs">
        <EmbeddedChatbot />
      </div>
    </div>
  );
};

export default Assistant;
