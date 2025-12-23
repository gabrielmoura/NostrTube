import { Spinner } from "@radix-ui/themes";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";

interface PageSpinnerProps {
  show?: boolean;
}

export function PageSpinner({ show = true }: PageSpinnerProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-background/60 dark:bg-background/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="p-6 rounded-2xl bg-card shadow-lg flex flex-col items-center justify-center gap-3 border border-border"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Spinner size="3" />
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
