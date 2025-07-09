import React from 'react';
import { cn } from '@/lib/utils';

const Stepper = ({ steps, className }) => {
  return (
    <div className={cn("w-full", className)}>
      {/* Desktop Layout - Horizontal */}
      <div className="hidden md:flex w-full" style={{ minHeight: '80px' }}>
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className={cn("flex items-start", isLast ? "flex-none" : "flex-1")}>
              {/* Step Circle and Content */}
              <div className="flex flex-col items-center">
                {/* Circle - absolutely fixed position */}
                <div className="w-10 h-10 rounded-full border-2 border-primary bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {stepNumber}
                </div>
                
                {/* Title - expand downward */}
                <div className="mt-2 text-center w-28">
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {step.title}
                  </p>
                </div>
              </div>

              {/* Connecting Line - absolutely fixed at circle height */}
              {!isLast && (
                <div className="flex-1 mx-4 relative">
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-primary" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Layout - Vertical */}
      <div className="md:hidden space-y-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-start">
              {/* Left side - Circle and Line */}
              <div className="flex flex-col items-center mr-4">
                {/* Circle */}
                <div className="w-8 h-8 rounded-full border-2 border-primary bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  {stepNumber}
                </div>

                {/* Connecting Line */}
                {!isLast && (
                  <div className="w-0.5 h-8 mt-2">
                    <div className="w-full h-full bg-primary" />
                  </div>
                )}
              </div>

              {/* Right side - Content */}
              <div className="flex-1 pt-1">
                <p className="text-sm font-medium text-foreground">
                  {step.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper; 