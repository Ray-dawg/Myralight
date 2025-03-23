import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";

interface FilterOption {
  label: string;
  value: string;
  type: "select" | "input" | "date";
  options?: { label: string; value: string }[];
}

interface FilterDialogProps {
  title: string;
  filters: FilterOption[];
  onApplyFilters: (filters: Record<string, any>) => void;
}

export function FilterDialog({
  title,
  filters,
  onApplyFilters,
}: FilterDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {filters.map((filter) => (
            <div key={filter.value} className="grid gap-2">
              <Label htmlFor={filter.value}>{filter.label}</Label>
              {filter.type === "select" ? (
                <Select>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={`Select ${filter.label.toLowerCase()}`}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : filter.type === "date" ? (
                <Input type="date" id={filter.value} />
              ) : (
                <Input id={filter.value} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline">Reset</Button>
          <Button>Apply Filters</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
