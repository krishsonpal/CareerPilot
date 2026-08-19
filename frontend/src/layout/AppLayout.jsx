import React from "react";

const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900">
      {children}
    </div>
  );
};

export default AppLayout;
