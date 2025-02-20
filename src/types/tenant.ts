
export interface Property {
  id: string;
  name: string;
  address: string;
}

export interface Tenant {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  property: {
    id: string;
    name: string;
    address: string;
  };
  tenancy: {
    id: string;
    start_date: string;
    end_date: string | null;
    status: string;
    monthly_pay_day?: number;
  };
}
