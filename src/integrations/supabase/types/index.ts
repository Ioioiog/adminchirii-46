
import { AuthSchema } from './auth-types';
import { MaintenanceSchema } from './maintenance-types';
import { PropertySchema } from './property-types';
import { TenantSchema } from './tenant-types';
import { PaymentSchema } from './payment-types';
import { UtilitySchema } from './utility-types';
import { ContractSchema } from '../database-types/contract';

export * from './auth-types';
export * from './maintenance-types';
export * from './property-types';
export * from './tenant-types';
export * from './payment-types';
export * from './utility-types';

export type Database = {
  public: AuthSchema['Tables'] &
    MaintenanceSchema['Tables'] &
    PropertySchema['Tables'] &
    TenantSchema['Tables'] &
    PaymentSchema['Tables'] &
    UtilitySchema['Tables'] &
    ContractSchema['Tables'];
};
