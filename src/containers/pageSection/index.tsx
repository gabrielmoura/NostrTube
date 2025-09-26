import {forwardRef, HTMLAttributes} from "react";
import {cn} from "@/helper/format.ts";

const Section = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({className, ...props}, ref) => (
    <div
        ref={ref}
        className={cn(
            "relative space-y-4 overflow-x-hidden sm:space-y-6",
            className,
        )}
        {...props}
    />
));
Section.displayName = "Section";

const SectionHeader = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({className, ...props}, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center justify-between max-sm:-mr-2", className)}
        {...props}
    />
));
SectionHeader.displayName = "SectionHeader";

const SectionTitle = forwardRef<
    HTMLParagraphElement,
    HTMLAttributes<HTMLHeadingElement>
>(({className, ...props}, ref) => (
    <h3
        ref={ref}
        className={cn("font-condensed text-xl font-bold sm:text-2xl", className)}
        {...props}
    />
));
SectionTitle.displayName = "SectionTitle";

const SectionContent = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({className, ...props}, ref) => (
    <div ref={ref} className={cn("relative", className)} {...props} />
));
SectionContent.displayName = "SectionContent";

export {Section, SectionHeader, SectionTitle, SectionContent};
