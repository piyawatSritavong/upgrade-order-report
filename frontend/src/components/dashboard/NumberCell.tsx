import { TableCell } from "../ui/table";

export const NumberCell = ({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) => {
  return (
    <TableCell className={`text-right tabular-nums text-sm ${className}`}>
      {value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </TableCell>
  );
};
