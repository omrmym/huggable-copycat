import { useState } from 'react';
import { UserPlus, Ticket, CreditCard, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { QuickRechargeDialog } from './QuickRechargeDialog';

const actions = [
  {
    icon: UserPlus,
    label: 'Add User',
    description: 'Create new PPPoE or Hotspot user',
    color: 'primary',
    action: 'add-user',
  },
  {
    icon: Ticket,
    label: 'Generate Vouchers',
    description: 'Create batch of hotspot vouchers',
    color: 'success',
    action: 'vouchers',
  },
  {
    icon: CreditCard,
    label: 'Quick Recharge',
    description: 'Recharge customer account',
    color: 'warning',
    action: 'recharge',
  },
  {
    icon: Send,
    label: 'Send Reminder',
    description: 'Notify expiring accounts',
    color: 'info',
    action: 'reminder',
  },
];

export function QuickActions() {
  const navigate = useNavigate();
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);

  const handleAction = (actionType: string) => {
    switch (actionType) {
      case 'add-user':
        navigate('/users/create');
        break;
      case 'vouchers':
        navigate('/vouchers');
        break;
      case 'recharge':
        setRechargeDialogOpen(true);
        break;
      case 'reminder':
        // TODO: Implement reminder functionality
        break;
    }
  };

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto py-4 flex flex-col items-start gap-2 hover:bg-secondary hover:border-primary/30 transition-all"
              onClick={() => handleAction(action.action)}
            >
              <action.icon className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="font-medium text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </div>

      <QuickRechargeDialog 
        open={rechargeDialogOpen} 
        onOpenChange={setRechargeDialogOpen} 
      />
    </>
  );
}
