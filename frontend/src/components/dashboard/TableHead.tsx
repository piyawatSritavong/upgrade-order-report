import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead } from "../ui/table";

export const CustomTableHead = ({
  label,
  sortKey,
  currentSort,
  onSort,
  align = "left",
  colorClass = "",
}: any) => {
  const isActive = currentSort.key === sortKey;
  return (
    <TableHead
      onClick={() => onSort(sortKey)}
      className={`h-12 cursor-pointer hover:bg-gray-100 transition-all ${align === "right" ? "text-right" : "text-left"}`}
    >
      <div
        className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${isActive ? "text-blue-600" : "text-gray-400"} ${align === "right" ? "justify-end" : ""}`}
      >
        <span className={colorClass}>{label}</span>
        {isActive ? (
          currentSort.direction === "asc" ? (
            <ArrowUp size={12} className="text-blue-600" />
          ) : (
            <ArrowDown size={12} className="text-blue-600" />
          )
        ) : (
          <ArrowUpDown size={12} className="opacity-20" />
        )}
      </div>
    </TableHead>
  );
};
