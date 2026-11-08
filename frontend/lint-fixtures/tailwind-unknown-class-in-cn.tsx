// path: features/heat/fixture.tsx
// expect: tailwindcss/no-custom-classname
import { cn } from "@/lib/utils"
export const Bad = () => <span className={cn("text-xs", "text-muted-forground")}>typo inside cn()</span>
