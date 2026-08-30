import { ProjectStatus } from "@/lib/projects";

export const STATUS_META: Record<ProjectStatus, { label: string; tone: string; stage: string }> = {
  CHECKOUT_CREATED: { label: "Checkout created", tone: "neutral", stage: "Checkout" },
  CHECKOUT_FAILED: { label: "Checkout failed", tone: "danger", stage: "Checkout" },
  PAID_BUILD_STARTING: { label: "Paid · starting 3D", tone: "info", stage: "3D" },
  BUILD_SUBMITTING: { label: "Starting 3D task", tone: "info", stage: "3D" },
  "3D_GENERATING": { label: "3D generating", tone: "info", stage: "3D" },
  BUILD_FAILED: { label: "3D failed", tone: "danger", stage: "3D" },
  MODEL_RESIZE_SUBMITTING: { label: "Starting size task", tone: "info", stage: "3D" },
  MODEL_RESIZING: { label: "Sizing model", tone: "info", stage: "3D" },
  PRINT_FILE_SUBMITTING: { label: "Starting 3MF task", tone: "info", stage: "Print file" },
  PRINT_FILE_GENERATING: { label: "Preparing 3MF", tone: "info", stage: "Print file" },
  PRINT_FILE_FAILED: { label: "3MF failed", tone: "danger", stage: "Print file" },
  READY_FOR_PRINT: { label: "Ready for print", tone: "success", stage: "Production" },
  PRINTING: { label: "Printing", tone: "warning", stage: "Production" },
  PRINTED: { label: "Printed", tone: "success", stage: "Production" },
  PACKED: { label: "Packed", tone: "success", stage: "Fulfillment" },
  SHIPPED: { label: "Shipped", tone: "success", stage: "Fulfillment" },
  CANCELLED: { label: "Cancelled", tone: "neutral", stage: "Closed" },
};

export const MANUAL_PRODUCTION_STATUSES: ProjectStatus[] = [
  "READY_FOR_PRINT",
  "PRINTING",
  "PRINTED",
  "PACKED",
  "SHIPPED",
  "CANCELLED",
];
