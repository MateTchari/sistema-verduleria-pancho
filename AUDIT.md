# AUDIT - CajaOS-inspired POS system

## Objetivo
Este documento registra el análisis funcional y visual inicial para reconstruir una aplicación propia, inspirada en la experiencia de CajaOS, sin copiar código ni recursos privados.

## Alcance observado
Se documentan las pantallas y flujos que pueden inferirse de la propuesta funcional y del diseño esperado para una solución de punto de venta y gestión comercial.

## Hallazgos preliminares
- La aplicación debe combinar operaciones de ventas, caja, productos, stock, reportes, mesas, cocina y facturación.
- La interfaz de usuario debe priorizar una experiencia de escritorio con navegación lateral, encabezado y paneles de resumen.
- El sistema debe ser multiempresa y multisucursal con aislamiento de datos.
- El flujo principal gira en torno a: autenticación, selección de empresa/sucursal, panel principal, ventas, caja y reportes.

## Pantallas y módulos propuestos
1. Autenticación
   - Login
   - Recuperación de contraseña
   - Registro de empresa / onboarding inicial
2. Panel principal
   - KPIs diarios
   - Ventas del día
   - Estado de caja
   - Alertas de stock
   - Accesos rápidos
3. Ventas / POS
   - Catálogo de productos
   - Carrito
   - Pagos combinados
   - Ticket / comprobante
4. Caja
   - Apertura
   - Movimientos
   - Cierre
5. Productos y stock
   - Alta/edición
   - Categorías
   - Ajustes de stock
6. Clientes
   - Alta y búsqueda
7. Mesas / gastronomía
   - Mesas, pedidos, comandas, cocina, cierre
8. Reportes
   - Ventas, stock, caja, auditoría
9. Configuración / administración
   - Usuarios, roles, empresa, sucursales, settings

## Observaciones de diseño
- Sidebar de navegación con secciones agrupadas.
- Tarjetas de métricas con estado visual destacado.
- Tablas con acciones compactas y filtros.
- Modales para crear/editar entidades.
- Estados de carga, error y vacío.

## Inferencias
- Los detalles exactos de iconografía, distribución precisa y textos de algunas pantallas son inferencias del alcance funcional, no una copia de la aplicación original.
- Las integraciones con ARCA y Mercado Pago se implementan como adaptadores y modos simulados.
