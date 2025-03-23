import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useState } from "react";

interface Action {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

interface FloatingActionButtonProps {
  actions: Action[];
}

export function FloatingActionButton({ actions }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-4 space-y-2"
          >
            {actions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-end gap-2"
              >
                <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded-md shadow-sm text-sm">
                  {action.label}
                </span>
                <Button
                  size="icon"
                  onClick={action.onClick}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {action.icon}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </motion.div>
      </Button>
    </div>
  );
}
