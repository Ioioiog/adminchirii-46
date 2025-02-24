
import { Button } from "@/components/ui/button";
import { CONTRACT_STATUS_TRANSITIONS, type ContractStatus } from "@/types/contract";
import { useUserRole } from "@/hooks/use-user-role";

interface ContractActionsProps {
  status: ContractStatus;
  onAction: (action: string) => void;
  isLoading?: boolean;
}

export function ContractActions({ status, onAction, isLoading }: ContractActionsProps) {
  const { userRole } = useUserRole();

  const availableActions = CONTRACT_STATUS_TRANSITIONS.filter(
    transition => transition.from === status && transition.role === userRole
  );

  if (availableActions.length === 0) return null;

  return (
    <div className="flex gap-2">
      {availableActions.map((transition) => (
        <Button
          key={transition.action}
          onClick={() => onAction(transition.action)}
          disabled={isLoading}
          variant={transition.action === 'sign' ? 'default' : 'outline'}
        >
          {transition.action === 'send_invite' && 'Send Invite'}
          {transition.action === 'sign' && 'Sign Contract'}
          {transition.action === 'cancel' && 'Cancel Contract'}
        </Button>
      ))}
    </div>
  );
}
