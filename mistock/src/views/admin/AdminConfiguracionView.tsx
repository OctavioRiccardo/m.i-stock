'use client';

/**
 * ====================================================================
 * VISTA: CONFIGURACIÓN GENERAL DEL SISTEMA (Patrón MVC - View)
 * ====================================================================
 * 
 * Propósito:
 * Proporcionar una consola centralizada de configuración para:
 * 1. Identidad comercial de la empresa y personalización de tickets térmicos.
 * 2. Políticas y métodos de pago habilitados en caja (POS).
 * 3. Reglas y umbrales globales de inventario.
 * 4. Monitor de infraestructura Supabase y exportación de respaldos CSV.
 */

import React, { useState } from 'react';
import { motion, MotionConfig } from 'motion/react';
import {
  Store,
  CreditCard,
  Sliders,
  Database,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Banknote,
  Smartphone,
  Package,
  FileSpreadsheet,
  AlertTriangle,
  Printer,
  Volume2,
  ScanLine,
  HardDrive,
  HelpCircle,
  Building2,
  Phone,
  Receipt,
  QrCode,
  DollarSign,
  Scale,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import {
  useAdminConfiguracionController,
  PestañaConfiguracion,
} from '@/controllers/adminControllers/configuracionController';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface AdminConfiguracionViewProps {
  controller: ReturnType<typeof useAdminConfiguracionController>;
}

/**
 * Componente Switch estilizado y accesible (Dub.co aesthetic)
 */
function SwitchToggle({
  id,
  checked,
  onChange,
  disabled = false,
  label,
}: {
  id?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2A7A78] focus:ring-offset-2 ${
        checked ? 'bg-[#2A7A78]' : 'bg-[#D5D3C8]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function AdminConfiguracionView({ controller }: AdminConfiguracionViewProps) {
  const {
    config,
    pestañaActiva,
    setPestañaActiva,
    guardando,
    mensajeExito,
    mensajeError,
    actualizarNegocio,
    actualizarPOS,
    toggleMetodoPago,
    actualizarInventario,
    guardarCambios,
    restablecerPorDefecto,
    exportarCatalogoCSV,
    exportarVentasCSV,
    limpiarMensajes,
  } = controller;

  const [modalRestablecerAbierto, setModalRestablecerAbierto] = useState<boolean>(false);

  const pestañas: Array<{
    id: PestañaConfiguracion;
    etiqueta: string;
    icono: React.ElementType;
    descripcion: string;
  }> = [
    {
      id: 'negocio',
      etiqueta: 'Negocio & Ticket',
      icono: Store,
      descripcion: 'Datos comerciales, fiscales y encabezado de comprobantes.',
    },
    {
      id: 'pos',
      etiqueta: 'Caja & Métodos de Pago',
      icono: CreditCard,
      descripcion: 'Medios de cobro habilitados, descuentos y escaneo en mostrador.',
    },
    {
      id: 'inventario',
      etiqueta: 'Reglas de Inventario',
      icono: Sliders,
      descripcion: 'Umbrales mínimos de seguridad y control estricto de catálogo.',
    },
    {
      id: 'respaldos',
      etiqueta: 'Respaldos & Base de Datos',
      icono: Database,
      descripcion: 'Salud de Supabase, descargas en CSV y restablecimiento.',
    },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-6 pb-20">
        {/* Cabecera Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E6DF] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#1C2424]">
                Configuración del Sistema
              </h1>
              <Badge variant="outline" className="text-[#2A7A78] border-[#2A7A78] bg-[#E2F1F0]/50 text-xs">
                Admin
              </Badge>
            </div>
            <p className="text-sm text-[#657373] mt-1">
              Personaliza la identidad del negocio, reglas de venta en caja y respaldos de información.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalRestablecerAbierto(true)}
              className="text-xs border-[#E8E6DF] text-[#657373] hover:text-[#1C2424] hover:bg-[#F2F1EA] gap-1.5 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restablecer</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={guardarCambios}
              disabled={guardando}
              className="bg-[#2A7A78] hover:bg-[#205E5C] text-white shadow-sm gap-1.5 cursor-pointer text-xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{guardando ? 'Guardando...' : 'Guardar Cambios'}</span>
            </Button>
          </div>
        </div>

        {/* Notificaciones de Estado */}
        {mensajeExito && (
          <Alert variant="success" className="cursor-pointer shadow-sm" onClick={limpiarMensajes}>
            <Check className="h-4 w-4" />
            <AlertTitle>Operación Completada</AlertTitle>
            <AlertDescription>{mensajeExito}</AlertDescription>
          </Alert>
        )}

        {mensajeError && (
          <Alert variant="destructive" className="cursor-pointer shadow-sm" onClick={limpiarMensajes}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atención</AlertTitle>
            <AlertDescription>{mensajeError}</AlertDescription>
          </Alert>
        )}

        {/* Navegación por Pestañas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-1.5 bg-[#F8F7F2] rounded-xl border border-[#E8E6DF]">
          {pestañas.map((p) => {
            const Icono = p.icono;
            const esActiva = pestañaActiva === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  limpiarMensajes();
                  setPestañaActiva(p.id);
                }}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                  esActiva
                    ? 'bg-white text-[#1C2424] font-semibold shadow-xs border border-[#E8E6DF]'
                    : 'text-[#657373] hover:text-[#1C2424] hover:bg-white/60'
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-md ${
                    esActiva ? 'bg-[#E2F1F0] text-[#2A7A78]' : 'bg-[#E8E6DF]/60 text-[#657373]'
                  }`}
                >
                  <Icono className="h-4 w-4" />
                </div>
                <div className="truncate">
                  <p className="truncate leading-snug">{p.etiqueta}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ==================================================================== */}
        {/* PESTAÑA 1: NEGOCIO & TICKET (Identidad + Preview de Ticket Térmico)   */}
        {/* ==================================================================== */}
        {pestañaActiva === 'negocio' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Columna Izquierda: Formulario de Datos Comerciales (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card 1: Identificación Comercial */}
              <Card className="border-[#E8E6DF] shadow-sm">
                <CardHeader className="pb-3 border-b border-[#E8E6DF]">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#2A7A78]" />
                    <CardTitle className="text-sm font-bold text-[#1C2424]">
                      Identificación del Comercio
                    </CardTitle>
                  </div>
                  <p className="text-xs text-[#657373]">
                    Información visible en la cabecera del sistema y en los comprobantes impresos.
                  </p>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#1C2424] mb-1">
                        Nombre de Fantasía / Comercial *
                      </label>
                      <Input
                        value={config.negocio.nombreComercial}
                        onChange={(e) => actualizarNegocio({ nombreComercial: e.target.value })}
                        placeholder="Ej: M.I Stock"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1C2424] mb-1">
                        Razón Social / Titular *
                      </label>
                      <Input
                        value={config.negocio.razonSocial}
                        onChange={(e) => actualizarNegocio({ razonSocial: e.target.value })}
                        placeholder="Ej: M.I Stock Almacén Comercial"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-semibold text-[#1C2424] mb-1">
                        CUIT / Identificación Fiscal
                      </label>
                      <Input
                        value={config.negocio.cuit}
                        onChange={(e) => actualizarNegocio({ cuit: e.target.value })}
                        placeholder="30-71829340-9"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-semibold text-[#1C2424] mb-1">
                        Símbolo Moneda
                      </label>
                      <Input
                        value={config.negocio.monedaSimbolo}
                        onChange={(e) => actualizarNegocio({ monedaSimbolo: e.target.value })}
                        placeholder="$"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-semibold text-[#1C2424] mb-1">
                        Código ISO
                      </label>
                      <Input
                        value={config.negocio.monedaCodigo}
                        onChange={(e) => actualizarNegocio({ monedaCodigo: e.target.value })}
                        placeholder="ARS"
                        className="h-9 text-xs uppercase"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Contacto y Ubicación */}
              <Card className="border-[#E8E6DF] shadow-sm">
                <CardHeader className="pb-3 border-b border-[#E8E6DF]">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#2A7A78]" />
                    <CardTitle className="text-sm font-bold text-[#1C2424]">
                      Ubicación y Canales de Atención
                    </CardTitle>
                  </div>
                  <p className="text-xs text-[#657373]">
                    Dirección física y medios de contacto para clientes y proveedores.
                  </p>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C2424] mb-1">
                      Dirección Comercial Completa
                    </label>
                    <Input
                      value={config.negocio.direccion}
                      onChange={(e) => actualizarNegocio({ direccion: e.target.value })}
                      placeholder="Av. Corrientes 3450, CABA"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#1C2424] mb-1">
                        Teléfono / WhatsApp
                      </label>
                      <Input
                        value={config.negocio.telefono}
                        onChange={(e) => actualizarNegocio({ telefono: e.target.value })}
                        placeholder="+54 9 11 4521-8890"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1C2424] mb-1">
                        Correo Electrónico
                      </label>
                      <Input
                        type="email"
                        value={config.negocio.emailContacto}
                        onChange={(e) => actualizarNegocio({ emailContacto: e.target.value })}
                        placeholder="contacto@mistock.com"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Régimen de Emisión y Validez Legal */}
              <Card className="border-[#E8E6DF] shadow-sm">
                <CardHeader className="pb-3 border-b border-[#E8E6DF]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-[#2A7A78]" />
                      <CardTitle className="text-sm font-bold text-[#1C2424]">
                        Régimen de Emisión y Validez Legal del Ticket
                      </CardTitle>
                    </div>
                    <Badge
                      variant={config.negocio.modoComprobante === 'no_fiscal' ? 'default' : 'success'}
                      className="text-[10px]"
                    >
                      {config.negocio.modoComprobante === 'no_fiscal' ? 'Control Interno' : 'Factura AFIP'}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#657373]">
                    Determina la naturaleza legal del comprobante impreso y los requisitos tributarios exigibles.
                  </p>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Selector de Régimen */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => actualizarNegocio({ modoComprobante: 'no_fiscal' })}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        config.negocio.modoComprobante === 'no_fiscal'
                          ? 'border-[#2A7A78] bg-[#E2F1F0]/30 shadow-xs'
                          : 'border-[#E8E6DF] bg-white hover:bg-[#F8F7F2]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold text-xs text-[#1C2424]">
                          <FileText className="h-3.5 w-3.5 text-[#2A7A78]" />
                          Comprobante Interno
                        </span>
                        {config.negocio.modoComprobante === 'no_fiscal' && (
                          <CheckCircle2 className="h-4 w-4 text-[#2A7A78]" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#657373] mt-1">
                        Ticket de cambio y entrega. No requiere permisos fiscales ni conexión a AFIP/ARCA.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => actualizarNegocio({ modoComprobante: 'factura_afip' })}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        config.negocio.modoComprobante === 'factura_afip'
                          ? 'border-[#2A7A78] bg-[#E2F1F0]/30 shadow-xs'
                          : 'border-[#E8E6DF] bg-white hover:bg-[#F8F7F2]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold text-xs text-[#1C2424]">
                          <Scale className="h-3.5 w-3.5 text-[#2A7A78]" />
                          Factura Electrónica
                        </span>
                        {config.negocio.modoComprobante === 'factura_afip' && (
                          <CheckCircle2 className="h-4 w-4 text-[#2A7A78]" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#657373] mt-1">
                        Validez tributaria oficial. Requiere Web Service WSFE y obtención de CAE.
                      </p>
                    </button>
                  </div>

                  {/* Parámetros específicos según el régimen */}
                  {config.negocio.modoComprobante === 'no_fiscal' ? (
                    <div className="p-3.5 rounded-lg bg-[#F8F7F2] border border-[#E8E6DF] space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-[#1C2424]">
                              Leyenda Legal Obligatoria
                            </p>
                            <Badge variant="outline" className="text-[10px] text-emerald-800 border-emerald-300 bg-emerald-50">
                              Protección Legal
                            </Badge>
                          </div>
                          <p className="text-xs text-[#657373] mt-0.5">
                            Imprime de forma visible la aclaración que especifica que el ticket es un comprobante de uso interno y no una factura.
                          </p>
                        </div>
                        <SwitchToggle
                          id="toggle-aclaracion-legal"
                          checked={config.negocio.mostrarAclaracionLegal}
                          onChange={(val) => actualizarNegocio({ mostrarAclaracionLegal: val })}
                          label="Imprimir leyenda legal de no válido como factura"
                        />
                      </div>

                      {config.negocio.mostrarAclaracionLegal && (
                        <div>
                          <label className="block text-xs font-semibold text-[#1C2424] mb-1">
                            Texto de la Aclaración Legal
                          </label>
                          <Input
                            value={config.negocio.textoAclaracionLegal}
                            onChange={(e) => actualizarNegocio({ textoAclaracionLegal: e.target.value })}
                            placeholder="DOCUMENTO NO VÁLIDO COMO FACTURA"
                            className="h-8 text-xs font-mono uppercase bg-white"
                          />
                          <p className="text-[10px] text-[#657373] mt-1">
                            Recomendación: Mantener <code>DOCUMENTO NO VÁLIDO COMO FACTURA</code> conforme a las pautas de control de la ley 11.683.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-700" />
                        <p className="text-xs font-semibold text-amber-900">
                          Requisitos para Facturación Electrónica en Vivo
                        </p>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Para emitir comprobantes fiscales válidos con CAE y código QR oficial (RG 4892), el comercio debe delegar el servicio <strong>WSFE v1</strong> en la web de AFIP con Clave Fiscal e ingresar el punto de venta correspondiente.
                      </p>
                      <div className="w-48">
                        <label className="block text-xs font-semibold text-[#1C2424] mb-1">
                          Punto de Venta Habilitado (N°)
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="99999"
                          value={config.negocio.puntoVenta || 1}
                          onChange={(e) =>
                            actualizarNegocio({ puntoVenta: Math.max(1, Number(e.target.value)) })
                          }
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card 4: Mensajes del Ticket */}
              <Card className="border-[#E8E6DF] shadow-sm">
                <CardHeader className="pb-3 border-b border-[#E8E6DF]">
                  <div className="flex items-center gap-2">
                    <Printer className="h-4 w-4 text-[#2A7A78]" />
                    <CardTitle className="text-sm font-bold text-[#1C2424]">
                      Textos del Comprobante Impreso (Ticket Térmico)
                    </CardTitle>
                  </div>
                  <p className="text-xs text-[#657373]">
                    Personaliza los mensajes institucionales que aparecerán arriba y abajo en cada venta.
                  </p>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C2424] mb-1">
                      Encabezado del Ticket
                    </label>
                    <Input
                      value={config.negocio.mensajeEncabezadoTicket}
                      onChange={(e) => actualizarNegocio({ mensajeEncabezadoTicket: e.target.value })}
                      placeholder="Comprobante de Venta - Línea de Cajas"
                      className="h-9 text-xs"
                    />
                    <p className="text-[11px] text-[#657373] mt-1">
                      Se imprime inmediatamente debajo del nombre comercial de la empresa.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C2424] mb-1">
                      Mensaje de Pie de Página / Agradecimiento
                    </label>
                    <Textarea
                      rows={2}
                      value={config.negocio.mensajePieTicket}
                      onChange={(e) => actualizarNegocio({ mensajePieTicket: e.target.value })}
                      placeholder="¡Muchas gracias por su compra! Conserve su ticket para cambios."
                      className="text-xs min-h-[64px]"
                    />
                    <p className="text-[11px] text-[#657373] mt-1">
                      Ideal para condiciones de cambio (ej: 30 días con comprobante) o saludos de cortesía.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Columna Derecha: Vista Previa en Vivo del Ticket Térmico 80mm (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="border-[#E8E6DF] shadow-sm sticky top-6">
                <CardHeader className="pb-3 border-b border-[#E8E6DF] bg-[#F8F7F2]/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-[#2A7A78]" />
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#1C2424]">
                        Simulador de Ticket Térmico (80mm)
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50">
                      Vista en Vivo
                    </Badge>
                  </div>
                  <p className="text-xs text-[#657373]">
                    Previsualización en tiempo real del comprobante emitido en las ticketeadoras de caja.
                  </p>
                </CardHeader>

                <CardContent className="p-4 bg-[#F2F1EA]/40">
                  {/* Papel Térmico Simulado */}
                  <div className="bg-white border border-[#D5D3C8] shadow-md rounded-md p-5 font-mono text-[11px] text-[#2C3539] max-w-sm mx-auto leading-relaxed">
                    {/* Header */}
                    <div className="text-center space-y-1 pb-3 border-b border-dashed border-[#A0A8A8]">
                      <p className="font-bold text-sm tracking-wide text-[#111827] uppercase">
                        {config.negocio.nombreComercial || 'M.I STOCK'}
                      </p>
                      <p className="text-[10px] text-[#4B5563]">
                        {config.negocio.razonSocial || 'Almacén Comercial'}
                      </p>
                      {config.negocio.cuit && (
                        <p className="text-[10px] text-[#4B5563]">
                          CUIT: {config.negocio.cuit}
                        </p>
                      )}
                      {config.negocio.direccion && (
                        <p className="text-[10px] text-[#4B5563]">
                          {config.negocio.direccion}
                        </p>
                      )}
                      {config.negocio.telefono && (
                        <p className="text-[10px] text-[#4B5563]">
                          TEL: {config.negocio.telefono}
                        </p>
                      )}

                      {/* Caja Destacada de Validez Legal según el Régimen */}
                      {config.negocio.modoComprobante === 'no_fiscal' ? (
                        config.negocio.mostrarAclaracionLegal && (
                          <div className="my-2 p-1.5 border border-dashed border-[#111827] bg-[#F9F9F6] text-center">
                            <p className="font-extrabold text-[9px] tracking-wide text-[#111827]">
                              *** {config.negocio.textoAclaracionLegal || 'DOCUMENTO NO VÁLIDO COMO FACTURA'} ***
                            </p>
                            <p className="text-[8px] text-[#6B7280] tracking-normal uppercase">
                              COMPROBANTE DE CONTROL INTERNO Y CAMBIO
                            </p>
                          </div>
                        )
                      ) : (
                        <div className="my-2 p-1.5 border-2 border-solid border-[#111827] bg-[#F9F9F6] text-center">
                          <p className="font-extrabold text-xs tracking-wider text-[#111827]">
                            FACTURA B
                          </p>
                          <p className="text-[9px] text-[#4B5563] font-semibold">
                            PTO. VTA: {String(config.negocio.puntoVenta || 1).padStart(4, '0')} - COMP. NRO: 00042891
                          </p>
                        </div>
                      )}

                      <p className="pt-0.5 text-[10px] font-semibold text-[#1F2937]">
                        {config.negocio.mensajeEncabezadoTicket || 'Comprobante de Entrega'}
                      </p>
                    </div>

                    {/* Metadata de Venta de Muestra */}
                    <div className="py-2.5 space-y-0.5 text-[10px] border-b border-dashed border-[#A0A8A8]">
                      <div className="flex justify-between">
                        <span>{config.negocio.modoComprobante === 'no_fiscal' ? 'TICKET NRO:' : 'COMPROBANTE N°:'}</span>
                        <span className="font-bold">
                          {String(config.negocio.puntoVenta || 1).padStart(4, '0')}-00042891
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>FECHA Y HORA:</span>
                        <span>25/09/2026 18:45</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CAJERO:</span>
                        <span>Lucas Benítez</span>
                      </div>
                      <div className="flex justify-between">
                        <span>FORMA DE PAGO:</span>
                        <span className="font-semibold">Efectivo</span>
                      </div>
                    </div>

                    {/* Items de Muestra */}
                    <div className="py-2.5 space-y-1.5 border-b border-dashed border-[#A0A8A8]">
                      <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-dotted border-[#D5D3C8]">
                        <span>CANT / ARTÍCULO</span>
                        <span>TOTAL</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="truncate pr-2">1.0 x Café Tostado Molido 500g</span>
                        <span className="font-semibold">{config.negocio.monedaSimbolo} 3.450,00</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="truncate pr-2">2.0 x Azúcar Chango 1kg</span>
                        <span className="font-semibold">{config.negocio.monedaSimbolo} 1.900,00</span>
                      </div>
                    </div>

                    {/* Totales */}
                    <div className="py-2.5 space-y-1 border-b border-dashed border-[#A0A8A8]">
                      <div className="flex justify-between text-[10px]">
                        <span>SUBTOTAL:</span>
                        <span>{config.negocio.monedaSimbolo} 5.350,00</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span>IVA (21.0%):</span>
                        <span>{config.negocio.monedaSimbolo} 1.123,50</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm pt-1 text-[#111827]">
                        <span>TOTAL:</span>
                        <span>{config.negocio.monedaSimbolo} 5.350,00</span>
                      </div>
                    </div>

                    {/* Footer del Ticket */}
                    <div className="pt-3 text-center space-y-2">
                      <p className="text-[10px] text-[#4B5563] italic">
                        {config.negocio.mensajePieTicket || '¡Gracias por su compra!'}
                      </p>

                      {config.negocio.modoComprobante === 'no_fiscal' ? (
                        <div className="flex flex-col items-center justify-center pt-1 text-[#6B7280]">
                          <QrCode className="h-9 w-9 opacity-60" />
                          <span className="text-[8px] mt-0.5 tracking-wider text-[#6B7280] uppercase">
                            CÓDIGO DE SEGUIMIENTO Y CAMBIOS
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="pt-2 text-[9px] border-t border-dashed border-[#A0A8A8] space-y-0.5 text-left font-mono">
                            <div className="flex justify-between">
                              <span>CAE N°:</span>
                              <span className="font-bold">74389201938472</span>
                            </div>
                            <div className="flex justify-between">
                              <span>VTO. CAE:</span>
                              <span>05/10/2026</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-center justify-center pt-1 text-[#111827]">
                            <QrCode className="h-10 w-10 text-[#111827]" />
                            <span className="text-[8px] mt-0.5 tracking-widest text-[#4B5563] font-bold">
                              AFIP QR OFICIAL (RG 4892)
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* ==================================================================== */}
        {/* PESTAÑA 2: CAJA & MÉTODOS DE PAGO (POS)                             */}
        {/* ==================================================================== */}
        {pestañaActiva === 'pos' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Sección: Métodos de Cobro Habilitados */}
            <Card className="border-[#E8E6DF] shadow-sm">
              <CardHeader className="pb-3 border-b border-[#E8E6DF]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#2A7A78]" />
                    <CardTitle className="text-sm font-bold text-[#1C2424]">
                      Métodos de Cobro Habilitados en Caja
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs text-[#657373]">
                    Línea de Mostrador (POS)
                  </Badge>
                </div>
                <p className="text-xs text-[#657373]">
                  Habilita o deshabilita los medios de pago disponibles para los operadores al concretar una venta.
                </p>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Tarjeta 1: Efectivo */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      config.pos.metodosPagoHabilitados.efectivo
                        ? 'border-[#2A7A78] bg-[#E2F1F0]/25'
                        : 'border-[#E8E6DF] bg-[#F8F7F2]/40 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          config.pos.metodosPagoHabilitados.efectivo
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Banknote className="h-5 w-5" />
                      </div>
                      <SwitchToggle
                        id="toggle-efectivo"
                        checked={config.pos.metodosPagoHabilitados.efectivo}
                        onChange={() => toggleMetodoPago('efectivo')}
                        label="Habilitar cobro en efectivo"
                      />
                    </div>
                    <div className="mt-3">
                      <p className="font-bold text-xs text-[#1C2424]">Efectivo</p>
                      <p className="text-[11px] text-[#657373] mt-0.5">
                        Cobros en billetes físicos, cálculo automático de vuelto y arqueo de caja.
                      </p>
                    </div>
                    <div className="mt-3">
                      <Badge
                        variant={config.pos.metodosPagoHabilitados.efectivo ? 'success' : 'secondary'}
                        className="text-[10px]"
                      >
                        {config.pos.metodosPagoHabilitados.efectivo ? 'Habilitado' : 'Deshabilitado'}
                      </Badge>
                    </div>
                  </div>

                  {/* Tarjeta 2: Tarjeta Débito */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      config.pos.metodosPagoHabilitados.tarjeta_debito
                        ? 'border-[#2A7A78] bg-[#E2F1F0]/25'
                        : 'border-[#E8E6DF] bg-[#F8F7F2]/40 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          config.pos.metodosPagoHabilitados.tarjeta_debito
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <SwitchToggle
                        id="toggle-debito"
                        checked={config.pos.metodosPagoHabilitados.tarjeta_debito}
                        onChange={() => toggleMetodoPago('tarjeta_debito')}
                        label="Habilitar tarjeta débito"
                      />
                    </div>
                    <div className="mt-3">
                      <p className="font-bold text-xs text-[#1C2424]">Tarjeta de Débito</p>
                      <p className="text-[11px] text-[#657373] mt-0.5">
                        Terminales POS / Posnet bancarios y cobros directos por cuenta corriente.
                      </p>
                    </div>
                    <div className="mt-3">
                      <Badge
                        variant={config.pos.metodosPagoHabilitados.tarjeta_debito ? 'success' : 'secondary'}
                        className="text-[10px]"
                      >
                        {config.pos.metodosPagoHabilitados.tarjeta_debito ? 'Habilitado' : 'Deshabilitado'}
                      </Badge>
                    </div>
                  </div>

                  {/* Tarjeta 3: Tarjeta Crédito */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      config.pos.metodosPagoHabilitados.tarjeta_credito
                        ? 'border-[#2A7A78] bg-[#E2F1F0]/25'
                        : 'border-[#E8E6DF] bg-[#F8F7F2]/40 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          config.pos.metodosPagoHabilitados.tarjeta_credito
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <SwitchToggle
                        id="toggle-credito"
                        checked={config.pos.metodosPagoHabilitados.tarjeta_credito}
                        onChange={() => toggleMetodoPago('tarjeta_credito')}
                        label="Habilitar tarjeta crédito"
                      />
                    </div>
                    <div className="mt-3">
                      <p className="font-bold text-xs text-[#1C2424]">Tarjeta de Crédito</p>
                      <p className="text-[11px] text-[#657373] mt-0.5">
                        Cobros en un pago y planes de financiamiento con tarjeta bancaria.
                      </p>
                    </div>
                    <div className="mt-3">
                      <Badge
                        variant={config.pos.metodosPagoHabilitados.tarjeta_credito ? 'success' : 'secondary'}
                        className="text-[10px]"
                      >
                        {config.pos.metodosPagoHabilitados.tarjeta_credito ? 'Habilitado' : 'Deshabilitado'}
                      </Badge>
                    </div>
                  </div>

                  {/* Tarjeta 4: Transferencia / QR */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      config.pos.metodosPagoHabilitados.transferencia
                        ? 'border-[#2A7A78] bg-[#E2F1F0]/25'
                        : 'border-[#E8E6DF] bg-[#F8F7F2]/40 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          config.pos.metodosPagoHabilitados.transferencia
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <SwitchToggle
                        id="toggle-transferencia"
                        checked={config.pos.metodosPagoHabilitados.transferencia}
                        onChange={() => toggleMetodoPago('transferencia')}
                        label="Habilitar transferencia QR"
                      />
                    </div>
                    <div className="mt-3">
                      <p className="font-bold text-xs text-[#1C2424]">Transferencia / QR</p>
                      <p className="text-[11px] text-[#657373] mt-0.5">
                        Billeteras virtuales (Mercado Pago, MODO, Cuenta DNI) y transferencias.
                      </p>
                    </div>
                    <div className="mt-3">
                      <Badge
                        variant={config.pos.metodosPagoHabilitados.transferencia ? 'success' : 'secondary'}
                        className="text-[10px]"
                      >
                        {config.pos.metodosPagoHabilitados.transferencia ? 'Habilitado' : 'Deshabilitado'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sección: Políticas Operativas de Venta y Permisos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card: Venta Sin Stock & Margen de Descuento */}
              <Card className="border-[#E8E6DF] shadow-sm">
                <CardHeader className="pb-3 border-b border-[#E8E6DF]">
                  <CardTitle className="text-sm font-bold text-[#1C2424]">
                    Políticas de Venta y Descuentos
                  </CardTitle>
                  <p className="text-xs text-[#657373]">
                    Límites de tolerancia para los operadores de mostrador y cajeros.
                  </p>
                </CardHeader>
                <CardContent className="p-4 space-y-5">
                  {/* Switch: Permitir venta sin stock */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-[#1C2424]">
                          Permitir Vender Sin Stock Físico
                        </p>
                        {config.pos.permitirVentaSinStock && (
                          <Badge variant="warning" className="text-[10px]">
                            Riesgo de saldo negativo
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[#657373] mt-1">
                        Si está habilitado, la caja permitirá concretar el cobro de artículos cuyo stock en sistema sea 0 o insuficiente.
                      </p>
                    </div>
                    <SwitchToggle
                      id="toggle-ventasin-stock"
                      checked={config.pos.permitirVentaSinStock}
                      onChange={(val) => actualizarPOS({ permitirVentaSinStock: val })}
                      label="Permitir venta sin stock"
                    />
                  </div>

                  <div className="border-t border-[#E8E6DF] pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-semibold text-[#1C2424]">
                          Límite de Descuento Manual para Vendedor
                        </p>
                        <p className="text-xs text-[#657373]">
                          Porcentaje máximo que el vendedor puede rebajar sin clave de administrador.
                        </p>
                      </div>
                      <Badge className="bg-[#E2F1F0] text-[#2A7A78] hover:bg-[#E2F1F0] text-xs font-bold px-2 py-0.5">
                        {config.pos.limiteDescuentoVendedor}% Máx
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="5"
                        value={config.pos.limiteDescuentoVendedor}
                        onChange={(e) =>
                          actualizarPOS({ limiteDescuentoVendedor: Number(e.target.value) })
                        }
                        className="w-full accent-[#2A7A78] cursor-pointer"
                      />
                      <div className="w-16">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={config.pos.limiteDescuentoVendedor}
                          onChange={(e) =>
                            actualizarPOS({ limiteDescuentoVendedor: Math.max(0, Math.min(100, Number(e.target.value))) })
                          }
                          className="h-8 text-xs text-center"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card: Periféricos y Ergonomía del Mostrador */}
              <Card className="border-[#E8E6DF] shadow-sm">
                <CardHeader className="pb-3 border-b border-[#E8E6DF]">
                  <CardTitle className="text-sm font-bold text-[#1C2424]">
                    Periféricos y Experiencia en Caja
                  </CardTitle>
                  <p className="text-xs text-[#657373]">
                    Configuraciones para acelerar la atención y confirmación auditiva.
                  </p>
                </CardHeader>
                <CardContent className="p-4 space-y-5">
                  {/* Switch: Sonido de confirmación */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Volume2 className="h-4 w-4 text-[#2A7A78]" />
                        <p className="text-xs font-semibold text-[#1C2424]">
                          Sonido Auditivo al Cobrar
                        </p>
                      </div>
                      <p className="text-xs text-[#657373] mt-1">
                        Emite una señal sonora de confirmación cada vez que se finaliza un ticket exitosamente en la caja.
                      </p>
                    </div>
                    <SwitchToggle
                      id="toggle-sonido"
                      checked={config.pos.sonidoConfirmacionVenta}
                      onChange={(val) => actualizarPOS({ sonidoConfirmacionVenta: val })}
                      label="Sonido auditivo al cobrar"
                    />
                  </div>

                  <div className="border-t border-[#E8E6DF] pt-4">
                    {/* Switch: Modo Escáner Rápido */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <ScanLine className="h-4 w-4 text-[#2A7A78]" />
                          <p className="text-xs font-semibold text-[#1C2424]">
                            Modo Escáner de Código de Barras Rápido
                          </p>
                        </div>
                        <p className="text-xs text-[#657373] mt-1">
                          Suma automáticamente 1 unidad al carrito y limpia el campo al detectar la lectura de la pistola USB.
                        </p>
                      </div>
                      <SwitchToggle
                        id="toggle-escaner"
                        checked={config.pos.modoEscanerRapido}
                        onChange={(val) => actualizarPOS({ modoEscanerRapido: val })}
                        label="Modo escáner rápido"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* ==================================================================== */}
        {/* PESTAÑA 3: REGLAS DE INVENTARIO                                      */}
        {/* ==================================================================== */}
        {pestañaActiva === 'inventario' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Card 1: Umbral de Stock de Seguridad */}
            <Card className="border-[#E8E6DF] shadow-sm">
              <CardHeader className="pb-3 border-b border-[#E8E6DF]">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-[#2A7A78]" />
                  <CardTitle className="text-sm font-bold text-[#1C2424]">
                    Umbrales de Existencias Mínimas
                  </CardTitle>
                </div>
                <p className="text-xs text-[#657373]">
                  Valores predeterminados asignados para advertencias de desabastecimiento.
                </p>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1C2424] mb-1">
                    Umbral Mínimo por Defecto (Unidades)
                  </label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      value={config.inventario.umbralMinimoPorDefecto}
                      onChange={(e) =>
                        actualizarInventario({
                          umbralMinimoPorDefecto: Math.max(1, Number(e.target.value)),
                        })
                      }
                      className="h-9 text-xs w-32"
                    />
                    <span className="text-xs text-[#657373]">unidades de seguridad</span>
                  </div>
                  <p className="text-xs text-[#657373] mt-2">
                    Cuando se dé de alta un nuevo producto sin especificar su stock mínimo, se utilizará esta cifra. Los productos cuyo stock sea menor o igual a este valor se marcarán automáticamente con alerta de reposición.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#F8F7F2] border border-[#E8E6DF] flex items-start gap-2.5">
                  <HelpCircle className="h-4 w-4 text-[#657373] mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-[#657373]">
                    El stock crítico se gestiona de forma centralizada en la tabla de <strong>Gestión de Inventario</strong>, donde puedes filtrar artículos en estado de alerta o sin existencias.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Validaciones y Control de Calidad */}
            <Card className="border-[#E8E6DF] shadow-sm">
              <CardHeader className="pb-3 border-b border-[#E8E6DF]">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-[#2A7A78]" />
                  <CardTitle className="text-sm font-bold text-[#1C2424]">
                    Integridad y Control de Precios
                  </CardTitle>
                </div>
                <p className="text-xs text-[#657373]">
                  Restricciones para evitar errores contables al crear o editar mercadería.
                </p>
              </CardHeader>
              <CardContent className="p-4 space-y-5">
                {/* Switch: Margen Negativo */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <p className="text-xs font-semibold text-[#1C2424]">
                        Bloqueo o Alerta de Margen Negativo
                      </p>
                    </div>
                    <p className="text-xs text-[#657373] mt-1">
                      Advierte al administrador si el precio de venta final es menor o igual al precio de costo del producto.
                    </p>
                  </div>
                  <SwitchToggle
                    id="toggle-margen"
                    checked={config.inventario.alertarMargenNegativo}
                    onChange={(val) => actualizarInventario({ alertarMargenNegativo: val })}
                    label="Alerta de margen negativo"
                  />
                </div>

                <div className="border-t border-[#E8E6DF] pt-4">
                  {/* Switch: Requerir categoría estricta */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-[#1C2424]">
                        Categorización Obligatoria Estricta
                      </p>
                      <p className="text-xs text-[#657373] mt-1">
                        Exige obligatoriamente seleccionar una categoría válida antes de permitir guardar cualquier artículo.
                      </p>
                    </div>
                    <SwitchToggle
                      id="toggle-cat-estricta"
                      checked={config.inventario.requerirCategoriaEstricta}
                      onChange={(val) => actualizarInventario({ requerirCategoriaEstricta: val })}
                      label="Categorización obligatoria"
                    />
                  </div>
                </div>

                <div className="border-t border-[#E8E6DF] pt-4">
                  {/* Switch: Control de Vencimientos */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-[#1C2424]">
                        Seguimiento de Lotes y Vencimientos
                      </p>
                      <p className="text-xs text-[#657373] mt-1">
                        Habilita la fecha de caducidad en el inventario para alimentos, farmacia o productos perecederos.
                      </p>
                    </div>
                    <SwitchToggle
                      id="toggle-vencimientos"
                      checked={config.inventario.controlarVencimientos}
                      onChange={(val) => actualizarInventario({ controlarVencimientos: val })}
                      label="Control de vencimientos"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ==================================================================== */}
        {/* PESTAÑA 4: RESPALDOS & BASE DE DATOS                                 */}
        {/* ==================================================================== */}
        {pestañaActiva === 'respaldos' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Monitor de Salud de la Infraestructura Supabase */}
            <Card className="border-[#E8E6DF] shadow-sm">
              <CardHeader className="pb-3 border-b border-[#E8E6DF]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-[#2A7A78]" />
                    <CardTitle className="text-sm font-bold text-[#1C2424]">
                      Monitor de Conexión e Infraestructura (Supabase Cloud)
                    </CardTitle>
                  </div>
                  <Badge variant="success" className="text-xs gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Base de Datos Activa
                  </Badge>
                </div>
                <p className="text-xs text-[#657373]">
                  Diagnóstico en tiempo real del motor relacional PostgreSQL y las políticas de seguridad.
                </p>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-[#F8F7F2] border border-[#E8E6DF]">
                    <span className="text-[11px] font-semibold text-[#657373] uppercase tracking-wider">
                      Motor de Datos
                    </span>
                    <p className="text-sm font-bold text-[#1C2424] mt-1">
                      {config.sistema.versionEsquema}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                      ✓ Políticas RLS verificadas
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#F8F7F2] border border-[#E8E6DF]">
                    <span className="text-[11px] font-semibold text-[#657373] uppercase tracking-wider">
                      Sincronización Realtime
                    </span>
                    <p className="text-sm font-bold text-[#1C2424] mt-1">
                      Postgres Changes
                    </p>
                    <p className="text-[11px] text-[#657373] mt-0.5">
                      Escucha activa en tablas clave
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#F8F7F2] border border-[#E8E6DF]">
                    <span className="text-[11px] font-semibold text-[#657373] uppercase tracking-wider">
                      Último Respaldo Local
                    </span>
                    <p className="text-sm font-bold text-[#1C2424] mt-1">
                      {config.sistema.ultimoRespaldo}
                    </p>
                    <p className="text-[11px] text-[#657373] mt-0.5">
                      Almacenamiento persistente
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#F8F7F2] border border-[#E8E6DF]">
                    <span className="text-[11px] font-semibold text-[#657373] uppercase tracking-wider">
                      Volumen de Registros
                    </span>
                    <p className="text-sm font-bold text-[#1C2424] mt-1">
                      {config.sistema.filasTotalesDB} registros
                    </p>
                    <p className="text-[11px] text-[#657373] mt-0.5">
                      Artículos, ventas y auditoría
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Descargas y Respaldos en CSV */}
            <Card className="border-[#E8E6DF] shadow-sm">
              <CardHeader className="pb-3 border-b border-[#E8E6DF]">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-[#2A7A78]" />
                  <CardTitle className="text-sm font-bold text-[#1C2424]">
                    Exportación de Datos y Respaldos Manuales
                  </CardTitle>
                </div>
                <p className="text-xs text-[#657373]">
                  Descarga planillas en formato CSV compatible con Microsoft Excel, Google Sheets y sistemas contables.
                </p>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Exportación 1: Catálogo */}
                  <div className="p-4 rounded-xl border border-[#E8E6DF] bg-white hover:border-[#2A7A78] transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E2F1F0] text-[#2A7A78]">
                          <Package className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          Formato UTF-8 .CSV
                        </Badge>
                      </div>
                      <p className="font-bold text-xs text-[#1C2424] mt-3">
                        Catálogo Completo de Productos
                      </p>
                      <p className="text-xs text-[#657373] mt-1 leading-relaxed">
                        Exporta el listado completo con códigos de barras, descripciones, categorías, precios de compra y venta, y stock físico en tiempo real.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E8E6DF]">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={exportarCatalogoCSV}
                        className="w-full text-xs border-[#2A7A78] text-[#2A7A78] hover:bg-[#E2F1F0] gap-1.5 cursor-pointer"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        <span>Descargar Catálogo CSV</span>
                      </Button>
                    </div>
                  </div>

                  {/* Exportación 2: Historial de Ventas */}
                  <div className="p-4 rounded-xl border border-[#E8E6DF] bg-white hover:border-[#2A7A78] transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          Formato UTF-8 .CSV
                        </Badge>
                      </div>
                      <p className="font-bold text-xs text-[#1C2424] mt-3">
                        Registro Histórico de Ventas
                      </p>
                      <p className="text-xs text-[#657373] mt-1 leading-relaxed">
                        Descarga el arqueo contable con número de ticket, fecha y hora, vendedor interviniente, método de cobro utilizado y total facturado.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E8E6DF]">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={exportarVentasCSV}
                        className="w-full text-xs border-emerald-600 text-emerald-800 hover:bg-emerald-50 gap-1.5 cursor-pointer"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        <span>Descargar Ventas CSV</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Zona de Mantenimiento y Restablecimiento */}
            <Card className="border-red-200 bg-red-50/20 shadow-sm">
              <CardHeader className="pb-3 border-b border-red-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <CardTitle className="text-sm font-bold text-red-900">
                    Zona de Mantenimiento del Sistema
                  </CardTitle>
                </div>
                <p className="text-xs text-red-700">
                  Acciones irreversibles sobre los parámetros de configuración local.
                </p>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[#1C2424]">
                      Restablecer Parámetros de Fábrica
                    </p>
                    <p className="text-xs text-[#657373] mt-0.5">
                      Vuelve todos los nombres de comercio, medios de pago y límites a los valores sugeridos por defecto.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setModalRestablecerAbierto(true)}
                    className="border-red-300 text-red-700 hover:bg-red-50 text-xs gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Restablecer Fábrica</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Modal de Confirmación para Restablecer Fábrica */}
        <Dialog open={modalRestablecerAbierto} onOpenChange={setModalRestablecerAbierto}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-amber-700 mb-1">
                <AlertTriangle className="h-5 w-5" />
                <DialogTitle>¿Restablecer Valores de Fábrica?</DialogTitle>
              </div>
              <DialogDescription className="text-xs text-[#657373] pt-1">
                Esta acción restablecerá los datos comerciales, opciones de tickets térmicos, medios de pago y reglas de inventario a su estado predeterminado.
                <br /><br />
                <strong className="text-[#1C2424]">Tus artículos y ventas registradas en Supabase NO se eliminarán.</strong>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalRestablecerAbierto(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  restablecerPorDefecto();
                  setModalRestablecerAbierto(false);
                }}
                className="text-xs gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Sí, Restablecer</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MotionConfig>
  );
}
