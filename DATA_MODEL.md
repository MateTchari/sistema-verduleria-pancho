# DATA_MODEL - Entidades base

## Entidades principales
- profiles
- organizations
- organization_members
- branches
- roles
- permissions
- member_roles
- categories
- products
- product_variants
- product_images
- branch_inventory
- stock_movements
- customers
- cash_registers
- cash_sessions
- cash_movements
- sales
- sale_items
- payments
- refunds
- tables
- table_sessions
- orders
- order_items
- kitchen_stations
- kitchen_tickets
- invoices
- invoice_attempts
- online_menus
- audit_logs
- app_settings

## Atributos comunes obligatorios
Cada entidad comercial debe incluir:
- organization_id
- branch_id
- created_by
- created_at
- updated_at

## Reglas de negocio generales
- Las operaciones monetarias se calculan y validan en el servidor.
- El stock solo cambia mediante movimientos auditable.
- El acceso entre empresas se limita con RLS.
- Los pagos y ventas deben ser atómicos.
