# SCRUM-58 Test Report: Pantalla de Administración de Cuentas del Personal

## Implementación Completada

### Archivos Creados
- **Tipos**: `src/types/staff.ts`
- **Servicio**: `src/services/staff/staff-service.ts` + tests
- **Componentes**:
  - `src/components/staff/staff-admin.tsx` (orquestador principal)
  - `src/components/staff/staff-table.tsx` (tabla de cuentas)
  - `src/components/staff/staff-form-dialog.tsx` (formulario de creación)
  - `src/components/staff/deactivate-staff-dialog.tsx` (confirmación de desactivación)
  - `src/components/staff/staff-form-logic.ts` (validaciones)
- **Página**: `app/admin/cuentas-del-personal/page.tsx`
- **Navegación**: Link agregado en `src/components/dashboard/role-navigation.tsx`

### Tests Unitarios (21 pasados)
- ✅ 6 tests de servicio (listStaffAccounts, createStaffAccount, deactivateStaffAccount)
- ✅ 9 tests de validación de formulario
- ✅ 6 tests de integración del componente

## Criterios de Aceptación

### Criterio 1: Tabla con nombre, correo, rol y estado, paginada de 20 en 20
- ✅ **Tabla**: Muestra nombre, correo, rol (traducido) y estado (badge)
- ✅ **Paginación**: 20 registros por página (PAGE_SIZE = 20 en StaffAdmin)
- ✅ **Navegación**: Botones de página anterior/siguiente
- ✅ **Contador**: Muestra total de cuentas

### Criterio 2: Desactivar una cuenta pide confirmación
- ✅ **Validación**: Botón "Desactivar" abre modal de confirmación
- ✅ **Cancelación**: Clicking "Cancelar" cierra sin hacer cambios
- ✅ **Confirmación**: Clicking "Desactivar" ejecuta deactivateStaffAccount
- ✅ **Estado deshabilitado**: Botón deshabilitado si cuenta ya está inactiva

### Criterio 3: Después de crear una cuenta, aparece en la tabla sin recargar
- ✅ **Creación**: Form modal con validaciones
- ✅ **Contraseña temporal**: Se muestra contraseña en modal separado
- ✅ **Recarga**: Después de cerrar modal, se recarga la lista
- ✅ **Sin refresh completo**: Solo se recarga vía useEffect con reloadKey

## Protección de Rutas (SCRUM-57)

### Ruta: `/admin/cuentas-del-personal`
- ✅ Protegida con `RoleGate` roles={["ADMIN"]}
- ✅ Acceso denegado para MEMBER, TRAINER, RECEPTION
- ✅ Link solo visible en navegación del ADMIN

## Instrucciones para Pruebas Manuales

### Requisitos
1. Backend ejecutándose con endpoints de SCRUM-55 en `/staff` y `/users/:id/status`
2. Frontend ejecutándose con `npm run dev`
3. Usuario con rol ADMIN autenticado

### Pruebas a Realizar

#### Test 1: Acceso a la Pantalla
```
1. Iniciar sesión con rol ADMIN
2. Ir a /dashboard
3. Click en "👥 Cuentas del Personal"
4. ✅ Debe mostrar tabla vacía o con cuentas existentes
5. ✅ No debe mostrar "Acceso denegado"
```

#### Test 2: Crear Nueva Cuenta
```
1. Click en botón "Nueva cuenta"
2. Llenar formulario:
   - Nombre: "Juan Test Pérez"
   - Correo: "juan.test@gym.com"
   - Rol: Seleccionar "Entrenador"
3. Click "Crear cuenta"
4. ✅ Debe validar campos (intentar dejar vacíos)
5. ✅ Debe mostrar contraseña temporal en modal
6. ✅ Click "Listo" debe cerrar modal y mostrar nueva cuenta en tabla
```

#### Test 3: Error de Correo Duplicado
```
1. Intentar crear cuenta con correo que ya existe
2. ✅ Debe mostrar error bajo campo de correo
3. ✅ Modal debe permanecer abierto para corregir
```

#### Test 4: Desactivar Cuenta (Confirmación)
```
1. En tabla, buscar una cuenta activa
2. Click en "Desactivar"
3. ✅ Debe mostrar diálogo de confirmación
4. Click "Cancelar"
5. ✅ Nada debe cambiar, diálogo se cierra
6. Click en "Desactivar" nuevamente
7. Click "Desactivar" en el diálogo
8. ✅ Toast de éxito debe aparecer
9. ✅ Cuenta debe pasar a estado "Inactiva"
10. ✅ Botón "Desactivar" debe deshabilitarse
```

#### Test 5: Paginación
```
1. Si hay más de 20 cuentas:
   - Click en "›" (página siguiente)
   - ✅ Debe mostrar cuentas 21-40
   - ✅ Contador debe actualizar a "Página 2 de N"
2. Click en "‹" (página anterior)
   - ✅ Debe volver a página 1
```

#### Test 6: Protección de Rutas (SCRUM-57)
```
1. Con rol MEMBER:
   - Intentar acceder a /admin/cuentas-del-personal
   - ✅ Debe mostrar "Acceso denegado"
   - ✅ Link no debe aparecer en /dashboard
   
2. Con rol RECEPTION:
   - Mismo test que MEMBER
   
3. Con rol ADMIN:
   - ✅ Acceso normal, sin bloqueos
```

#### Test 7: Validaciones de Formulario
```
1. Click "Nueva cuenta"
2. Nombre:
   - Vacío: ✅ Error "El nombre es requerido"
   - Menos de 3 caracteres: ✅ Error "mínimo 3 caracteres"
   - Más de 100: ✅ Error "máximo 100 caracteres"
3. Correo:
   - Vacío: ✅ Error "requerido"
   - Inválido (ej: "test"): ✅ Error "no es válido"
   - Más de 120: ✅ Error "máximo 120 caracteres"
4. Rol:
   - No seleccionar: ✅ Error "requerido"
```

## Estado de Implementación

| Criterio | Estado | Tests | Notas |
|----------|--------|-------|-------|
| Tabla (20 por página) | ✅ | 21/21 | Componentes listos |
| Desactivación + confirmación | ✅ | 21/21 | Modal implementado |
| Creación sin recargar | ✅ | 21/21 | Recarga vía reloadKey |
| Protección de rutas (SCRUM-57) | ✅ | 21/21 | RoleGate aplicado |
| Validaciones | ✅ | 21/21 | Lógica testeada |
| Build exitoso | ✅ | - | npm run build ✓ |

## Endpoints Utilizados

### Del Backend (SCRUM-55)
- `GET /staff?page=1&pageSize=20` → Lista paginada
- `POST /staff` → Crear cuenta (devuelve contraseña temporal)
- `PATCH /users/{userId}/status` → Desactivar (con `{ isActive: false }`)

## Commits Realizados

1. `7f67bca` - Servicio y tipos
2. `1accbb1` - Componentes UI
3. `cdd0c29` - Página con protección
4. `878b4d7` - Correcciones de tipos
5. `362b9d1` - Link en navegación

## Notas Importantes

- La contraseña temporal solo se muestra una vez al crear
- No se puede desactivar propia cuenta (protección del backend)
- Desactivar no es reversible desde este frontend (ver con backend si es necesario)
- La tabla está ordenada por el backend (parámetro por defecto)

## Próximos Pasos (Opcional)

- [ ] Agregar exportar lista a CSV
- [ ] Filtro por rol/estado en tabla
- [ ] Búsqueda por nombre/correo
- [ ] Reactivar cuentas (si backend lo soporta)
