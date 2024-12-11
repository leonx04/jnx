import * as React from "react";

import { cn } from "@/lib/utils";

// Thêm một thành viên tối thiểu vào interface hoặc loại bỏ nếu không cần thiết
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  customProp?: string; // Ví dụ thêm thuộc tính tùy chỉnh
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, customProp, ...props }, ref) => {
    console.log(customProp);
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
