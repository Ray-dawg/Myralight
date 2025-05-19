import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  const [prevValue, setPrevValue] = React.useState(value || 0);

  // Update prevValue when value changes, with a slight delay for animation
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setPrevValue(value || 0);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
        className,
      )}
      {...props}
    >
      <motion.div
        className="h-full bg-primary absolute top-0 left-0"
        initial={{ width: `${prevValue}%` }}
        animate={{ width: `${value || 0}%` }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          duration: 0.5,
        }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
