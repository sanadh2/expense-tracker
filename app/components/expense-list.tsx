"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Copy,
  MoreVertical,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
  useExpensesList,
  useUpdateExpense,
} from "@/lib/hooks/use-expenses";
import { CATEGORY_SEPARATOR, type Expense } from "@/lib/types/expense";
import type { ExpenseFormData } from "@/lib/validations/expense";

import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { ExpenseModal } from "./expense-modal";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

function useDebouncedValue<T>(
  value: T,
  delay: number,
  onDebouncedChange?: () => void,
): T {
  const [debounced, setDebounced] = useState(value);
  const onDebouncedChangeRef = useRef(onDebouncedChange);

  useEffect(() => {
    onDebouncedChangeRef.current = onDebouncedChange;
  }, [onDebouncedChange]);

  useEffect(() => {
    const t = setTimeout(() => {
      onDebouncedChangeRef.current?.();
      setDebounced(value);
    }, delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const PAISE_PER_RUPEE = 100;
const SKELETON_ROW_COUNT = 3;

const formatCurrency = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(paise / PAISE_PER_RUPEE);

function parseCategory(value: string): {
  category: string;
  subcategory: string;
} {
  const idx = value.indexOf(CATEGORY_SEPARATOR);
  if (idx === -1) {
    return { category: value, subcategory: "" };
  }
  return {
    category: value.slice(0, idx),
    subcategory: value.slice(idx + CATEGORY_SEPARATOR.length),
  };
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

interface ExpenseListProps {
  isAddModalOpen: boolean;
  onAddModalOpenChange: (open: boolean) => void;
}

function formatDateForFilter(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDateRangeLabel(dateRange: DateRange | undefined): string {
  if (dateRange?.from == null) return "Date range";
  const fromStr = formatDate(formatDateForFilter(dateRange.from));
  if (dateRange.to == null) return fromStr;
  return `${fromStr} – ${formatDate(formatDateForFilter(dateRange.to))}`;
}

function ExpenseListSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-4">Amount</TableHead>
          <TableHead className="px-4">Category</TableHead>
          <TableHead className="px-4">Subcategory</TableHead>
          <TableHead className="px-4">Date</TableHead>
          <TableHead className="px-4">Note</TableHead>
          <TableHead className="w-[60px] px-4 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
          <TableRow key={i}>
            <TableCell className="px-4">
              <Skeleton className="h-5 w-20" />
            </TableCell>
            <TableCell className="px-4">
              <Skeleton className="h-5 w-20" />
            </TableCell>
            <TableCell className="px-4">
              <Skeleton className="h-5 w-16" />
            </TableCell>
            <TableCell className="px-4">
              <Skeleton className="h-5 w-24" />
            </TableCell>
            <TableCell className="px-4">
              <Skeleton className="h-5 w-32" />
            </TableCell>
            <TableCell className="px-4">
              <Skeleton className="h-8 w-20" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ExpenseListEmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-xl border border-dashed border-border/60 bg-muted/30 py-20">
      <p className="text-muted-foreground text-center text-sm">
        No expenses yet. Add your first expense to get started.
      </p>
      <Button onClick={onAddClick} size="sm">
        Add expense
      </Button>
    </div>
  );
}

interface ExpenseListContentProps {
  searchInput: string;
  setSearchInput: (v: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (r: DateRange | undefined) => void;
  filters: { search?: string; startDate?: string; endDate?: string };
  page: number;
  setPage: (fn: (p: number) => number) => void;
  total: number;
  totalPages: number;
  expenses: Expense[];
  isAddModalOpen: boolean;
  onAddModalOpenChange: (open: boolean) => void;
  editingExpense: Expense | null;
  setEditingExpense: (e: Expense | null) => void;
  deletingExpense: Expense | null;
  setDeletingExpense: (e: Expense | null) => void;
  onCreate: (data: ExpenseFormData) => Promise<void>;
  onUpdate: (data: ExpenseFormData) => Promise<void>;
  onDeleteConfirm: () => void;
  createPending: boolean;
  createError: Error | null | undefined;
  updatePending: boolean;
  updateError: Error | null | undefined;
  deletePending: boolean;
}

function ExpenseListContent({
  searchInput,
  setSearchInput,
  dateRange,
  setDateRange,
  filters,
  page,
  setPage,
  total,
  totalPages,
  expenses,
  isAddModalOpen,
  onAddModalOpenChange,
  editingExpense,
  setEditingExpense,
  deletingExpense,
  setDeletingExpense,
  onCreate,
  onUpdate,
  onDeleteConfirm,
  createPending,
  createError,
  updatePending,
  updateError,
  deletePending,
}: ExpenseListContentProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const hasActiveFilters =
    dateRange?.from != null || (filters.search?.length ?? 0) > 0;

  const getCopyButtonText = () => {
    if (copySuccess) return "Copied!";
    if (isCopying) return "Copying...";
    return "Copy to JSON";
  };

  const handleCopyToJson = async () => {
    try {
      setIsCopying(true);
      setCopySuccess(false);

      const params: Record<string, string> = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.search?.trim()) params.search = filters.search.trim();

      const allExpenses = await api.get<Expense[]>("/api/expenses", { params });

      const jsonString = JSON.stringify(allExpenses, null, 2);

      await navigator.clipboard.writeText(jsonString);

      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy expenses:", error);
      setCopyError("Failed to copy expenses to clipboard. Please try again.");
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search by category or note..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0">
              <CalendarIcon className="mr-2 size-4" />
              {getDateRangeLabel(dateRange)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              autoFocus
            />
          </PopoverContent>
        </Popover>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateRange(undefined);
              setSearchInput("");
            }}
          >
            Clear filters
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyToJson}
          disabled={isCopying || total === 0}
          className="shrink-0"
        >
          <Copy className="mr-2 size-4" />
          {getCopyButtonText()}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4">Amount</TableHead>
            <TableHead className="px-4">Category</TableHead>
            <TableHead className="px-4">Subcategory</TableHead>
            <TableHead className="px-4">Date</TableHead>
            <TableHead className="min-w-[120px] px-4">Note</TableHead>
            <TableHead className="w-[60px] px-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-12 text-center text-muted-foreground"
              >
                No expenses match your filters.
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="px-4 font-medium">
                  {formatCurrency(expense.amount)}
                </TableCell>
                <TableCell className="px-4">
                  {parseCategory(expense.category).category}
                </TableCell>
                <TableCell className="px-4 text-muted-foreground">
                  {parseCategory(expense.category).subcategory || "—"}
                </TableCell>
                <TableCell className="px-4 text-muted-foreground">
                  {formatDate(expense.date)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate px-4 text-muted-foreground">
                  {expense.note ?? "—"}
                </TableCell>
                <TableCell className="px-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label="Actions"
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingExpense(expense)}
                      >
                        <PencilIcon className="size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeletingExpense(expense)}
                      >
                        <Trash2Icon className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4">
          <p className="text-muted-foreground text-sm">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="text-muted-foreground min-w-[100px] text-center text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              aria-label="Next page"
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <ExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => onAddModalOpenChange(false)}
        onSubmit={onCreate}
        isPending={createPending}
        error={createError}
      />

      <ExpenseModal
        isOpen={Boolean(editingExpense)}
        onClose={() => setEditingExpense(null)}
        onSubmit={onUpdate}
        expense={editingExpense}
        isPending={updatePending}
        error={updateError}
      />

      <DeleteConfirmationModal
        isOpen={Boolean(deletingExpense)}
        onClose={() => setDeletingExpense(null)}
        onConfirm={onDeleteConfirm}
        isPending={deletePending}
      />

      <AlertDialog
        open={Boolean(copyError)}
        onOpenChange={(open) => !open && setCopyError(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>{copyError}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setCopyError(null)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ExpenseList({
  isAddModalOpen,
  onAddModalOpenChange,
}: ExpenseListProps) {
  const [searchInput, setSearchInput] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const debouncedSearch = useDebouncedValue(
    searchInput,
    SEARCH_DEBOUNCE_MS,
    () => setPage(1),
  );

  const filters = useMemo(
    () => ({
      startDate:
        dateRange?.from != null
          ? formatDateForFilter(dateRange.from)
          : undefined,
      endDate:
        dateRange?.to != null ? formatDateForFilter(dateRange.to) : undefined,
      search: debouncedSearch || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [dateRange, debouncedSearch, page],
  );

  const hasFilters = Boolean(
    filters.search ?? filters.startDate ?? filters.endDate,
  );

  const listQuery = useExpensesList(filters, { enabled: hasFilters });
  const fullQuery = useExpenses();

  const { expenses, total, totalPages, isLoading, error } = useMemo(() => {
    if (!hasFilters) {
      const all = (fullQuery.data ?? [])
        .slice()
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
      const totalCount = all.length;
      const start = (page - 1) * PAGE_SIZE;
      const pageSlice = all.slice(start, start + PAGE_SIZE);
      return {
        expenses: pageSlice,
        total: totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
        isLoading: fullQuery.isLoading,
        error: fullQuery.error,
      };
    }
    const { data: listData } = listQuery;
    const list = listData?.data ?? [];
    const totalCount = listData?.total ?? 0;
    return {
      expenses: list,
      total: totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
      isLoading: listQuery.isLoading,
      error: listQuery.error,
    };
  }, [
    hasFilters,
    page,
    fullQuery.data,
    fullQuery.isLoading,
    fullQuery.error,
    listQuery,
  ]);

  const deleteExpense = useDeleteExpense();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
  };

  const handleCreate = async (data: ExpenseFormData) => {
    await createExpense.mutateAsync(data);
    onAddModalOpenChange(false);
  };

  const handleUpdate = async (data: ExpenseFormData) => {
    if (!editingExpense) {
      return;
    }
    await updateExpense.mutateAsync({ id: editingExpense.id, data });
    setEditingExpense(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingExpense) {
      return;
    }
    deleteExpense.mutate(deletingExpense.id, {
      onSuccess: () => setDeletingExpense(null),
    });
  };

  if (isLoading) {
    return <ExpenseListSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
        Failed to load expenses. Please try again.
      </div>
    );
  }

  const isEmptyState =
    total === 0 &&
    page === 1 &&
    !filters.search &&
    !filters.startDate &&
    !filters.endDate;

  if (isEmptyState) {
    return (
      <>
        <ExpenseListEmptyState onAddClick={() => onAddModalOpenChange(true)} />
        <ExpenseModal
          isOpen={isAddModalOpen}
          onClose={() => onAddModalOpenChange(false)}
          onSubmit={handleCreate}
          isPending={createExpense.isPending}
          error={createExpense.error}
        />
      </>
    );
  }

  return (
    <ExpenseListContent
      searchInput={searchInput}
      setSearchInput={setSearchInput}
      dateRange={dateRange}
      setDateRange={handleDateRangeChange}
      filters={filters}
      page={page}
      setPage={setPage}
      total={total}
      totalPages={totalPages}
      expenses={expenses}
      isAddModalOpen={isAddModalOpen}
      onAddModalOpenChange={onAddModalOpenChange}
      editingExpense={editingExpense}
      setEditingExpense={setEditingExpense}
      deletingExpense={deletingExpense}
      setDeletingExpense={setDeletingExpense}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDeleteConfirm={handleDeleteConfirm}
      createPending={createExpense.isPending}
      createError={createExpense.error}
      updatePending={updateExpense.isPending}
      updateError={updateExpense.error}
      deletePending={deleteExpense.isPending}
    />
  );
}
