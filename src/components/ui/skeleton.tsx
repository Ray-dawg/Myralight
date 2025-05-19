import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <motion.div
      className={cn("rounded-md bg-primary/10", className)}
      initial={{ opacity: 0.5 }}
      animate={{
        opacity: [0.5, 0.8, 0.5],
        backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
      }}
      transition={{
        duration: 1.5,
        ease: "linear",
        repeat: Infinity,
        repeatType: "loop",
      }}
      style={{
        backgroundSize: "200% 100%",
        backgroundImage:
          "linear-gradient(90deg, var(--primary-light, rgba(0,0,0,0.05)) 25%, var(--primary-lighter, rgba(0,0,0,0.07)) 50%, var(--primary-light, rgba(0,0,0,0.05)) 75%)",
      }}
      {...props}
    />
  );
}

export { Skeleton };
