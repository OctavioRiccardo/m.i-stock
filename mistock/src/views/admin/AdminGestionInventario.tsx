'use client';

import React, { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Grid,
  Card,
  Group,
  Button,
  TextInput,
  NumberInput,
  Select,
  Textarea,
  Badge,
  Stack,
  Alert,
  Modal,
  Table,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconBox,
  IconPlus,
  IconCheck,
  IconAlertCircle,
  IconBarcode,
  IconFolderPlus,
  IconCategory,
  IconBuildingWarehouse,
  IconPercentage,
  IconRefresh,
} from '@tabler/icons-react';
import { useAdminDashboardController } from '@/controllers/adminControllers/adminDashboardController';
import {
  FormularioCargaProducto,
  valoresInicialesCargaProducto,
} from '@/models/modelos_vista/cargaProductoModel';
import { UnidadMedida } from '@/models/modelos_dominio/productoModel';
import classes from './AdminGestionInventario.module.css';

interface AdminGestionInventarioProps {
  controller: ReturnType<typeof useAdminDashboardController>;
}

const unidadesDisponibles: { value: UnidadMedida; label: string }[] = [
  { value: 'unidad', label: 'Unidad (un.)' },
  { value: 'kg', label: 'Kilogramo (kg)' },
  { value: 'gramo', label: 'Gramo (g)' },
  { value: 'litro', label: 'Litro (L)' },
  { value: 'metro', label: 'Metro (m)' },
  { value: 'paquete', label: 'Paquete / Pack' },
];

export function AdminGestionInventario({ controller }: AdminGestionInventarioProps) {
  const {
    categorias,
    productos,
    loading,
    mensajeExito,
    mensajeError,
    agregarCategoria,
    guardarProducto,
    limpiarMensajes,
  } = controller;

  // Estado del modal para nueva categoría
  const [modalCatOpened, setModalCatOpened] = useState(false);
  const [nuevaCatNombre, setNuevaCatNombre] = useState('');
  const [nuevaCatDesc, setNuevaCatDesc] = useState('');
  const [errorCat, setErrorCat] = useState<string | null>(null);

  // Formulario principal de carga de producto
  const form = useForm<FormularioCargaProducto>({
    initialValues: valoresInicialesCargaProducto,
    validate: {
      categoriaId: (val) =>
        !val || val.trim() === ''
          ? 'El producto debe pertenecer a una categoría definida obligatoriamente'
          : null,
      nombre: (val) =>
        val.trim().length < 2 ? 'El nombre debe tener al menos 2 caracteres' : null,
      codigo: (val) =>
        val.trim().length === 0 ? 'El código o SKU es obligatorio' : null,
      precioVenta: (val) =>
        val <= 0 ? 'El precio de venta debe ser mayor a 0' : null,
      stockInicial: (val) =>
        val < 0 ? 'El stock inicial no puede ser negativo' : null,
    },
  });

  // Categoría seleccionada actualmente
  const categoriaSeleccionada = categorias.find((c) => c.id === form.values.categoriaId);

  // Cálculo en vivo de rentabilidad
  const costo = Number(form.values.precioCosto) || 0;
  const venta = Number(form.values.precioVenta) || 0;
  const gananciaNeta = venta - costo;
  const margenPorcentaje = costo > 0 ? ((gananciaNeta / costo) * 100).toFixed(1) : '100.0';
  const esRentable = venta >= costo;

  // Manejar creación rápida de categoría
  const handleCrearCategoria = () => {
    if (!nuevaCatNombre.trim()) {
      setErrorCat('El nombre de la categoría es requerido.');
      return;
    }

    const nueva = agregarCategoria(nuevaCatNombre, nuevaCatDesc);
    form.setFieldValue('categoriaId', nueva.id);
    setNuevaCatNombre('');
    setNuevaCatDesc('');
    setErrorCat(null);
    setModalCatOpened(false);
  };

  // Generar SKU automático
  const handleGenerarSku = () => {
    const prefijo = categoriaSeleccionada
      ? categoriaSeleccionada.nombre.slice(0, 3).toUpperCase()
      : 'SKU';
    const num = Math.floor(1000 + Math.random() * 9000);
    form.setFieldValue('codigo', `${prefijo}-${num}`);
  };

  // Submit del producto
  const handleSubmit = (values: FormularioCargaProducto) => {
    const res = guardarProducto(values);
    if (res.exito) {
      form.reset();
      // Mantener la categoría previamente seleccionada para facilitar la carga en lote
      if (values.categoriaId) {
        form.setFieldValue('categoriaId', values.categoriaId);
      }
    }
  };

  return (
    <Container size="xl" py="lg">
      <Stack gap="lg">
        {/* Encabezado */}
        <div>
          <Title order={2} className={classes.title}>
            Gestión de Inventario
          </Title>
          <Text className={classes.subtitle}>
            Alta y carga de productos al catálogo organizados por categoría.
          </Text>
        </div>

        {/* Notificaciones globales */}
        {mensajeExito && (
          <Alert
            icon={<IconCheck size={18} />}
            title="Operación Exitosa"
            color="teal"
            variant="filled"
            radius="md"
            withCloseButton
            onClose={limpiarMensajes}
          >
            {mensajeExito}
          </Alert>
        )}

        {mensajeError && (
          <Alert
            icon={<IconAlertCircle size={18} />}
            title="Atención"
            color="red"
            variant="filled"
            radius="md"
            withCloseButton
            onClose={limpiarMensajes}
          >
            {mensajeError}
          </Alert>
        )}

        {/* PASO 1: REGLA DE NEGOCIO OBLIGATORIA - CATEGORÍA */}
        <Card p="lg" className={classes.categorySection}>
          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <IconCategory size={22} color="#2A7A78" />
                <Title order={4} style={{ color: '#1C2424' }}>
                  Paso 1: Definir la Categoría del Producto
                </Title>
              </Group>
              <Badge color="teal" variant="light" size="md">
                Obligatorio
              </Badge>
            </Group>

            <Text size="sm" c="#657373">
              En miStock, <strong>un producto no puede existir sin una categoría definida</strong>. 
              Selecciona a qué categoría pertenecerá este producto o crea una nueva si aún no existe.
            </Text>

            <Grid align="flex-end">
              <Grid.Col span={{ base: 12, sm: 8, md: 9 }}>
                <Select
                  label="Categoría de Destino *"
                  placeholder="Selecciona la categoría donde se alojará el producto"
                  data={categorias.map((c) => ({ value: c.id, label: c.nombre }))}
                  value={form.values.categoriaId}
                  onChange={(val) => form.setFieldValue('categoriaId', val || '')}
                  error={form.errors.categoriaId}
                  size="md"
                  searchable
                  clearable
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4, md: 3 }}>
                <Button
                  leftSection={<IconFolderPlus size={16} />}
                  variant="light"
                  color="teal"
                  fullWidth
                  size="md"
                  onClick={() => setModalCatOpened(true)}
                >
                  + Nueva Categoría
                </Button>
              </Grid.Col>
            </Grid>

            {categoriaSeleccionada && (
              <Group gap="xs" mt="xs">
                <Badge className={classes.categoryActiveBadge} size="lg">
                  Categoría seleccionada: {categoriaSeleccionada.nombre}
                </Badge>
                {categoriaSeleccionada.descripcion && (
                  <Text size="xs" c="dimmed">
                    ({categoriaSeleccionada.descripcion})
                  </Text>
                )}
              </Group>
            )}
          </Stack>
        </Card>

        {/* PASO 2: FORMULARIO DE CARGA DEL PRODUCTO */}
        <Card p="xl" className={classes.card}>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="lg">
              <Group justify="space-between" align="center">
                <Group gap="xs">
                  <IconBox size={22} color="#2A7A78" />
                  <Title order={4} style={{ color: '#1C2424' }}>
                    Paso 2: Datos del Producto
                  </Title>
                </Group>
                {!form.values.categoriaId && (
                  <Badge color="yellow" variant="light">
                    Selecciona una categoría arriba para continuar
                  </Badge>
                )}
              </Group>

              <fieldset
                disabled={!form.values.categoriaId}
                style={{
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  opacity: form.values.categoriaId ? 1 : 0.65,
                }}
              >
                <Grid gap="md">
                  {/* Código / SKU */}
                  <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <TextInput
                      label="Código de Barras / SKU *"
                      placeholder="Ej: 779001 o PROD-101"
                      leftSection={<IconBarcode size={16} />}
                      rightSection={
                        <Tooltip label="Generar código automático">
                          <ActionIcon variant="subtle" color="teal" onClick={handleGenerarSku}>
                            <IconRefresh size={14} />
                          </ActionIcon>
                        </Tooltip>
                      }
                      {...form.getInputProps('codigo')}
                    />
                  </Grid.Col>

                  {/* Nombre del Producto */}
                  <Grid.Col span={{ base: 12, sm: 6, md: 5 }}>
                    <TextInput
                      label="Nombre del Producto *"
                      placeholder="Ej: Aceite de Girasol 1.5L"
                      {...form.getInputProps('nombre')}
                    />
                  </Grid.Col>

                  {/* Unidad de Medida */}
                  <Grid.Col span={{ base: 12, sm: 12, md: 3 }}>
                    <Select
                      label="Unidad de Medida *"
                      data={unidadesDisponibles}
                      {...form.getInputProps('unidadMedida')}
                    />
                  </Grid.Col>

                  {/* Descripción */}
                  <Grid.Col span={12}>
                    <Textarea
                      label="Descripción / Especificaciones (Opcional)"
                      placeholder="Detalles sobre presentación, marca, contenido neto..."
                      minRows={2}
                      {...form.getInputProps('descripcion')}
                    />
                  </Grid.Col>

                  {/* Precios & Rentabilidad */}
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card p="md" className={classes.profitBox}>
                      <Stack gap="xs">
                        <Text size="xs" fw={700} tt="uppercase" c="#2A7A78">
                          Precios y Márgenes Comerciales
                        </Text>
                        <Grid gap="xs">
                          <Grid.Col span={6}>
                            <NumberInput
                              label="Precio de Costo ($)"
                              placeholder="0"
                              min={0}
                              thousandSeparator="."
                              decimalSeparator=","
                              prefix="$ "
                              {...form.getInputProps('precioCosto')}
                            />
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <NumberInput
                              label="Precio de Venta ($) *"
                              placeholder="0"
                              min={0}
                              thousandSeparator="."
                              decimalSeparator=","
                              prefix="$ "
                              {...form.getInputProps('precioVenta')}
                            />
                          </Grid.Col>
                        </Grid>

                        <Group justify="space-between" mt="xs">
                          <div>
                            <Text size="xs" c="dimmed">
                              Ganancia estimada por unidad:
                            </Text>
                            <Text size="sm" fw={700} c={esRentable ? '#2A7A78' : 'red'}>
                              ${gananciaNeta.toLocaleString('es-AR')}
                            </Text>
                          </div>
                          <div>
                            <Text size="xs" c="dimmed">
                              Margen sobre costo:
                            </Text>
                            <Badge
                              color={esRentable ? 'teal' : 'red'}
                              variant="light"
                              size="sm"
                              leftSection={<IconPercentage size={12} />}
                            >
                              {margenPorcentaje}%
                            </Badge>
                          </div>
                        </Group>
                      </Stack>
                    </Card>
                  </Grid.Col>

                  {/* Stock & Almacenamiento */}
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card p="md" className={classes.profitBox}>
                      <Stack gap="xs">
                        <Text size="xs" fw={700} tt="uppercase" c="#2A7A78">
                          Control de Stock y Almacén
                        </Text>
                        <Grid gap="xs">
                          <Grid.Col span={6}>
                            <NumberInput
                              label="Stock Inicial a Cargar *"
                              description="Unidades que ingresan hoy"
                              min={0}
                              {...form.getInputProps('stockInicial')}
                            />
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <NumberInput
                              label="Stock Mínimo (Alerta) *"
                              description="Aviso de stock crítico"
                              min={0}
                              {...form.getInputProps('stockMinimo')}
                            />
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <TextInput
                              label="Ubicación en Depósito"
                              placeholder="Ej: Pasillo 2 - Estante B"
                              {...form.getInputProps('ubicacion')}
                            />
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <TextInput
                              label="Proveedor / Distribuidor"
                              placeholder="Ej: Distribuidora Norte"
                              {...form.getInputProps('proveedor')}
                            />
                          </Grid.Col>
                        </Grid>
                      </Stack>
                    </Card>
                  </Grid.Col>
                </Grid>

                {/* Botones de acción */}
                <Group justify="flex-end" mt="xl">
                  <Button
                    variant="default"
                    onClick={() => form.reset()}
                    disabled={loading}
                  >
                    Limpiar Campos
                  </Button>
                  <Button
                    type="submit"
                    className={classes.submitBtn}
                    leftSection={<IconPlus size={16} />}
                    loading={loading}
                    disabled={!form.values.categoriaId}
                  >
                    {categoriaSeleccionada
                      ? `Guardar Producto en "${categoriaSeleccionada.nombre}"`
                      : 'Guardar Producto en Inventario'}
                  </Button>
                </Group>
              </fieldset>
            </Stack>
          </form>
        </Card>

        {/* TABLA DE PRODUCTOS EN INVENTARIO */}
        <Card p="md" className={classes.card}>
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Title order={4} className={classes.title}>
                  Productos en Inventario ({productos.length})
                </Title>
                <Text size="xs" c="#657373">
                  Listado de productos agrupados por su categoría correspondiente.
                </Text>
              </div>
              <IconBuildingWarehouse size={22} color="#2A7A78" />
            </Group>

            <Table.ScrollContainer minWidth={650}>
              <Table verticalSpacing="sm" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ color: '#1C2424' }}>Código</Table.Th>
                    <Table.Th style={{ color: '#1C2424' }}>Producto</Table.Th>
                    <Table.Th style={{ color: '#1C2424' }}>Categoría Asignada</Table.Th>
                    <Table.Th style={{ color: '#1C2424' }}>Costo</Table.Th>
                    <Table.Th style={{ color: '#1C2424' }}>Precio Venta</Table.Th>
                    <Table.Th style={{ color: '#1C2424' }}>Stock Actual</Table.Th>
                    <Table.Th style={{ color: '#1C2424' }}>Estado</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {productos.map((prod) => {
                    const esCritico = prod.stockActual <= prod.stockMinimo;
                    return (
                      <Table.Tr key={prod.id}>
                        <Table.Td fw={700} style={{ color: '#1C2424' }}>
                          <Group gap={4}>
                            <IconBarcode size={14} color="#657373" />
                            {prod.codigo}
                          </Group>
                        </Table.Td>
                        <Table.Td fw={600} style={{ color: '#1C2424' }}>
                          {prod.nombre}
                          {prod.descripcion && (
                            <Text size="xs" c="dimmed">
                              {prod.descripcion}
                            </Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Badge color="teal" variant="light" size="sm">
                            {prod.categoria?.nombre || 'Sin Categoría'}
                          </Badge>
                        </Table.Td>
                        <Table.Td style={{ color: '#657373' }}>
                          ${prod.precioCosto.toLocaleString('es-AR')}
                        </Table.Td>
                        <Table.Td fw={700} style={{ color: '#1C2424' }}>
                          ${prod.precioVenta.toLocaleString('es-AR')}
                        </Table.Td>
                        <Table.Td>
                          <Text fw={700} c={esCritico ? 'red' : '#1C2424'}>
                            {prod.stockActual} {prod.unidadMedida || 'un.'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={esCritico ? 'red' : 'teal'}
                            variant="filled"
                            size="sm"
                          >
                            {esCritico ? 'Stock Crítico' : 'Normal'}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Stack>
        </Card>
      </Stack>

      {/* MODAL PARA CREAR NUEVA CATEGORÍA */}
      <Modal
        opened={modalCatOpened}
        onClose={() => {
          setModalCatOpened(false);
          setErrorCat(null);
        }}
        title="Crear Nueva Categoría"
        centered
        radius="md"
      >
        <Stack gap="md">
          <Text size="sm" c="#657373">
            Recuerda que los productos se cargan asociados a una categoría específica.
          </Text>

          {errorCat && (
            <Alert color="red" title="Error" icon={<IconAlertCircle size={16} />}>
              {errorCat}
            </Alert>
          )}

          <TextInput
            label="Nombre de la Categoría *"
            placeholder="Ej: Ferretería, Congelados, Perfumería"
            value={nuevaCatNombre}
            onChange={(e) => setNuevaCatNombre(e.currentTarget.value)}
            required
            data-autofocus
          />

          <Textarea
            label="Descripción (Opcional)"
            placeholder="Breve detalle sobre los productos incluidos en esta categoría"
            value={nuevaCatDesc}
            onChange={(e) => setNuevaCatDesc(e.currentTarget.value)}
            minRows={2}
          />

          <Group justify="flex-end" mt="sm">
            <Button
              variant="default"
              onClick={() => {
                setModalCatOpened(false);
                setErrorCat(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              className={classes.submitBtn}
              leftSection={<IconFolderPlus size={16} />}
              onClick={handleCrearCategoria}
            >
              Crear Categoría
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
