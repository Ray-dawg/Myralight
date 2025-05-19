import { TooltipProvider as RadixTooltipProvider } from "@/components/ui/tooltip";

const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return <RadixTooltipProvider>{children}</RadixTooltipProvider>;
};

export default TooltipProvider;
