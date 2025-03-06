
###DASHBOARD 
The dashboard page is the main landing page for authenticated users. It provides a unique view for each user role (landlord, tenant, or service provider) with relevant metrics and functionality.

Let me explain how it's structured:

Dashboard Structure
The main dashboard container is in src/pages/Index.tsx, which:

Authenticates the user
Determines the user's role
Renders the appropriate dashboard component based on role
Role-Specific Dashboards
Each user role has a dedicated dashboard component:

Landlord Dashboard (LandlordDashboard.tsx):

Property metrics (total properties, monthly revenue, active tenants, pending maintenance)
Calendar section for important dates
Revenue tracking and predictions
Upcoming income section
Tenant Dashboard (TenantDashboard.tsx):

Property information for rented units
Maintenance request access
Document management
Payment status information
Service Provider Dashboard (ServiceProviderDashboard.tsx):

Active job metrics
Completed jobs counter
Monthly earnings tracker
Getting started guide for new providers
Key Components
DashboardMetrics: Shows role-specific metrics in cards
DashboardHeader: Displays welcome message with user's name
DashboardLayout: Provides the sidebar and main content structure
RevenueSection: Visualizes financial data for landlords
Internationalization
The dashboard is fully internationalized with translations available in:

English
Spanish
French
Romanian
State and Data
The dashboard uses React Query to fetch and cache data:

Tenant properties
Landlord metrics
Service provider jobs
Revenue data
Navigation
The sidebar (DashboardSidebar.tsx) provides navigation to other parts of the application, with role-specific menu items displayed based on the user's permissions.

Responsive Design
The dashboard is fully responsive, adapting to mobile, tablet, and desktop viewports through Tailwind CSS classes.


