"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import {
  AggregatedItem,
  OrderApiResponse,
  Category,
} from "@/app/types/dashboard";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CustomTableHead } from "@/components/dashboard/TableHead";
import { NumberCell } from "@/components/dashboard/NumberCell";

type SortKey = keyof AggregatedItem | "productName";
type SortConfig = { key: SortKey; direction: "asc" | "desc" | null };

export default function DashboardClient() {
  const [items, setItems] = useState<AggregatedItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [startDate, setStartDate] = useState<string>("2024-04-09");
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [selectedCat, setSelectedCat] = useState<string>("ALL");
  const [selectedSub, setSelectedSub] = useState<string>("ALL");
  const [orderId, setOrderId] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  const limit = 10;
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "buyQty",
    direction: "desc",
  });

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data: Category[]) => setCategories(data))
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
        categoryId: selectedCat === "ALL" ? "" : selectedCat,
        subCategoryId: selectedSub === "ALL" ? "" : selectedSub,
        orderId: orderId.trim(),
        startDate,
        endDate,
        grade: grade.trim().toUpperCase(),
        minSellTotal: minPrice.replace(/,/g, "") || "0",
        maxSellTotal:
          maxPrice.replace(/,/g, "") || Number.MAX_SAFE_INTEGER.toString(),
      });
      const res = await fetch(`/api/orders?${params.toString()}`);
      if (!res.ok) throw new Error("Fetch failed");
      const json: OrderApiResponse = await res.json();
      setItems(json.data || []);
      setTotalPages(json.totalPages || 1);
    } catch (e) {
      console.error("Error fetching data:", e);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    selectedCat,
    selectedSub,
    startDate,
    endDate,
    grade,
    orderId,
    minPrice,
    maxPrice,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getProductDisplay = useCallback(
    (subId: string, catId: string) => {
      const category = categories.find((c) => c.categoryId === catId);
      const sub = category?.subcategory?.find((s) => s.subCategoryId === subId);
      return {
        subName:
          sub?.subCategoryName ||
          (subId.startsWith("NONE-") ? "ทั่วไป (ไม่ระบุย่อย)" : subId),
        catName: category?.categoryName || "ไม่ระบุหมวดหมู่",
      };
    },
    [categories],
  );

  const sortedItems = useMemo(() => {
    if (!sortConfig.direction) return items;
    return [...items].sort((a, b) => {
      let aVal = a[sortConfig.key as keyof AggregatedItem] ?? 0;
      let bVal = b[sortConfig.key as keyof AggregatedItem] ?? 0;
      if (sortConfig.key === "productName") {
        aVal = getProductDisplay(a.subCategoryId, a.categoryId).subName;
        bVal = getProductDisplay(b.subCategoryId, b.categoryId).subName;
      }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [items, sortConfig, getProductDisplay]);

  const requestSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Card className="shadow-sm border-gray-100">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2 text-blue-600 font-semibold text-lg">
            <Filter size={20} />
            <span>กรองข้อมูลรายการสั่งซื้อ</span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              fetchData();
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase">
                ตั้งแต่วันที่
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase">
                ถึงวันที่
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase">
                หมวดหมู่หลัก
              </label>
              <Select
                value={selectedCat}
                onValueChange={(val) => {
                  setSelectedCat(val);
                  setSelectedSub("ALL");
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทั้งหมด</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.categoryId} value={c.categoryId}>
                      {c.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase">
                หมวดหมู่ย่อย
              </label>
              <Select
                value={selectedSub}
                onValueChange={(val) => {
                  setSelectedSub(val);
                  setPage(1);
                }}
                disabled={selectedCat === "ALL" || !selectedCat}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทั้งหมด</SelectItem>
                  {categories
                    .find((c) => c.categoryId === selectedCat)
                    ?.subcategory?.map((s) => (
                      <SelectItem key={s.subCategoryId} value={s.subCategoryId}>
                        {s.subCategoryName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase">
                Order ID
              </label>
              <Input
                type="text"
                placeholder="ระบุเลขคำสั่งซื้อ..."
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                className={`text-[11px] font-bold uppercase ${
                  grade && !["A", "B", "C", "D"].includes(grade)
                    ? "text-destructive"
                    : "text-gray-400"
                }`}
              >
                เกรด (A-D)
              </label>
              <Input
                type="text"
                maxLength={1}
                value={grade}
                onChange={(e) => setGrade(e.target.value.toUpperCase())}
                className={`h-10 uppercase ${
                  grade && !["A", "B", "C", "D"].includes(grade)
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }`}
                placeholder="A"
              />
              {grade && !["A", "B", "C", "D"].includes(grade) && (
                <span className="text-[10px] font-medium text-destructive animate-in fade-in slide-in-from-top-1">
                  กรุณาระบุ A, B, C หรือ D เท่านั้น
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase">
                ยอดขาย (Min - Max)
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="h-10 w-1/2"
                />
                <Input
                  type="text"
                  placeholder="ไม่จำกัด"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="h-10 w-1/2"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button
                type="submit"
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all"
              >
                {loading ? (
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                ) : (
                  <Search size={18} className="mr-2" />
                )}
                ค้นหาข้อมูล
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-gray-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
              <CustomTableHead
                label="ข้อมูลสินค้า"
                sortKey="productName"
                currentSort={sortConfig}
                onSort={requestSort}
              />
              <CustomTableHead
                label="ซื้อ (กก.)"
                sortKey="buyQty"
                currentSort={sortConfig}
                onSort={requestSort}
                align="right"
              />
              <CustomTableHead
                label="รวมซื้อ (฿)"
                sortKey="buyTotal"
                currentSort={sortConfig}
                onSort={requestSort}
                align="right"
              />
              <CustomTableHead
                label="ขาย (กก.)"
                sortKey="sellQty"
                currentSort={sortConfig}
                onSort={requestSort}
                align="right"
              />
              <CustomTableHead
                label="รวมขาย (฿)"
                sortKey="sellTotal"
                currentSort={sortConfig}
                onSort={requestSort}
                align="right"
              />
              <CustomTableHead
                label="คงคลัง (กก.)"
                sortKey="stockBalance"
                currentSort={sortConfig}
                onSort={requestSort}
                align="right"
                colorClass="text-blue-600"
              />
              <CustomTableHead
                label="ดุลเงิน (฿)"
                sortKey="moneyBalance"
                currentSort={sortConfig}
                onSort={requestSort}
                align="right"
                colorClass="text-emerald-600"
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.length > 0 ? (
              sortedItems.map((item) => {
                const info = getProductDisplay(
                  item.subCategoryId,
                  item.categoryId,
                );
                return (
                  <TableRow
                    key={`${item.subCategoryId}-${item.categoryId}`}
                    className="hover:bg-gray-50/50"
                  >
                    <TableCell className="py-4">
                      <div className="font-bold text-gray-800">
                        {info.subName}
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase">
                        {info.catName} | {item.subCategoryId}
                      </div>
                      {item.orderId && (
                        <div className="mt-2 flex items-center">
                          <Badge
                            variant="secondary"
                            className="text-[9px] font-medium opacity-80"
                          >
                            ID: {item.orderId} (
                            {new Date(
                              item.orderFinishedDate!,
                            ).toLocaleDateString("th-TH")}
                            )
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                    <NumberCell value={item.buyQty} />
                    <NumberCell value={item.buyTotal} />
                    <NumberCell value={item.sellQty} />
                    <NumberCell value={item.sellTotal} />
                    <NumberCell
                      value={item.stockBalance}
                      className="font-bold text-blue-600 bg-blue-50/10"
                    />
                    <NumberCell
                      value={item.moneyBalance}
                      className={`font-bold bg-emerald-50/10 ${item.moneyBalance >= 0 ? "text-emerald-600" : "text-red-600"}`}
                    />
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-48 text-center text-gray-400"
                >
                  {loading ? (
                    <div className="flex justify-center items-center gap-2 italic">
                      <Loader2 className="animate-spin h-5 w-5 text-blue-500" />{" "}
                      กำลังประมวลผลข้อมูล...
                    </div>
                  ) : (
                    "ไม่พบข้อมูลตามเงื่อนไขที่ระบุ"
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between px-2">
        <span className="text-xs text-gray-500 font-medium">
          หน้า {page} / {totalPages} (รวม {items.length} รายการในหน้านี้)
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            className="h-9 w-9"
          >
            <ChevronLeft size={18} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="h-9 w-9"
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
