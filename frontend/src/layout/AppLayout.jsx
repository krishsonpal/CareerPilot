import React from "react";

const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {children}
    </div>
  );
};

export default AppLayout;
