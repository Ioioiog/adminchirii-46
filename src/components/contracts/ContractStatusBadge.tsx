
import { Badge } from "@/components/ui/badge";
import { CONTRACT_STATUS_BADGES } from "@/types/contract";
import type { ContractStatus } from "@/types/contract";

interface ContractStatusBadgeProps {
  status: ContractStatus;
}

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  const statusConfig = CONTRACT_STATUS_BADGES[status];

  return (
    <Badge
      variant={statusConfig.variant}
      className={statusConfig.className}
    >
      {statusConfig.label}
    </Badge>
  );
}
