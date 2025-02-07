import { StandardType, standardTypes } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";

interface StandardSelectorProps {
  value: StandardType;
  onChange: (value: StandardType) => void;
  disabled?: boolean;
}

export function StandardSelector({
  value,
  onChange,
  disabled,
}: StandardSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Accounting Standard</Label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as StandardType)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {standardTypes.map((standard) => (
            <SelectItem key={standard} value={standard}>
              {standard.replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
