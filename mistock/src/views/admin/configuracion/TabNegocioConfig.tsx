'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  Warning,
  Printer,
  Buildings,
  Phone,
  Receipt,
  Scales,
  FileText,
  CheckCircle,
} from '@phosphor-icons/react';
import { useAdminConfiguracionController } from '@/controllers/adminControllers/configuracionController';
import { CondicionIva } from '@/models/modelos_vista/configuracionModel';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  LIMITES_TEXTO,
  esCuitValido,
  esEmailValido,
  esTelefonoValido,
  sanitizarCodigoIsoInput,
  sanitizarEnteroInput,
  sanitizarSimboloMonedaInput,
  sanitizarTelefonoInput,
  formatearCuitInput,
} from '@/lib/validaciones';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SwitchToggle } from './SwitchToggle';

interface TabNegocioConfigProps {
  controller: ReturnType<typeof useAdminConfiguracionController>;
  campoEditandoVacio: string | null;
  setCampoEditandoVacio: (campo: string | null) => void;
}

export function TabNegocioConfig({
  controller,
  campoEditandoVacio,
  setCampoEditandoVacio,
}: TabNegocioConfigProps) {
  const { config, actualizarNegocio } = controller;
  const discriminaIvaFactura =
    config.negocio.modoComprobante === 'factura_afip' &&
    config.negocio.condicionIva === 'responsable_inscripto';

  return (
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
                    <Buildings className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
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
                        maxLength={LIMITES_TEXTO.NOMBRE_COMERCIAL_MAX}
                        onBlur={() => {
                          if (!config.negocio.nombreComercial.trim()) {
                            actualizarNegocio({ nombreComercial: 'M.I Stock' });
                          }
                        }}
                        value={config.negocio.nombreComercial}
                        onChange={(e) =>
                          actualizarNegocio({
                            nombreComercial: e.target.value.replace(/\s{2,}/g, ' '),
                          })
                        }
                        placeholder="Ej: M.I Stock"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1C2424] mb-1">
                        Razón Social / Titular *
                      </label>
                      <Input
                        maxLength={LIMITES_TEXTO.RAZON_SOCIAL_MAX}
                        value={config.negocio.razonSocial}
                        onChange={(e) =>
                          actualizarNegocio({
                            razonSocial: e.target.value.replace(/\s{2,}/g, ' '),
                          })
                        }
                        placeholder="Ej: M.I Stock Almacén Comercial"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#1C2424] mb-1">
                        CUIT / Identificación Fiscal
                      </label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={LIMITES_TEXTO.CUIT_MAX}
                        error={
                          config.negocio.cuit && !esCuitValido(config.negocio.cuit)
                            ? 'Debe tener 11 dígitos (XX-XXXXXXXX-X)'
                            : undefined
                        }
                        value={config.negocio.cuit}
                        onChange={(e) =>
                          actualizarNegocio({ cuit: formatearCuitInput(e.target.value) })
                        }
                        placeholder="30-71829340-9"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1C2424] mb-1">
                        Condición Tributaria (IVA)
                      </label>
                      <select
                        value={config.negocio.condicionIva || 'monotributo'}
                        onChange={(e) => actualizarNegocio({ condicionIva: e.target.value as CondicionIva })}
                        className="flex h-9 w-full rounded-md border border-[#E8E6DF] bg-white px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2A7A78] text-[#1C2424]"
                      >
                        <option value="monotributo">Responsable Monotributo</option>
                        <option value="responsable_inscripto">Responsable Inscripto</option>
                        <option value="consumidor_final">Consumidor Final</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1C2424] mb-1">
                        Símbolo Moneda
                      </label>
                      <Input
                        maxLength={4}
                        onBlur={() => {
                          if (!config.negocio.monedaSimbolo.trim()) {
                            actualizarNegocio({ monedaSimbolo: '$' });
                          }
                        }}
                        value={config.negocio.monedaSimbolo}
                        onChange={(e) =>
                          actualizarNegocio({
                            monedaSimbolo: sanitizarSimboloMonedaInput(e.target.value),
                          })
                        }
                        placeholder="$"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1C2424] mb-1">
                        Código ISO
                      </label>
                      <Input
                        maxLength={3}
                        onBlur={() => {
                          if (config.negocio.monedaCodigo.trim().length < 3) {
                            actualizarNegocio({ monedaCodigo: 'ARS' });
                          }
                        }}
                        value={config.negocio.monedaCodigo}
                        onChange={(e) =>
                          actualizarNegocio({
                            monedaCodigo: sanitizarCodigoIsoInput(e.target.value),
                          })
                        }
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
                    <Phone className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
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
                      autoComplete="street-address"
                      maxLength={LIMITES_TEXTO.DIRECCION_MAX}
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
                        type="tel"
                        autoComplete="tel"
                        maxLength={LIMITES_TEXTO.TELEFONO_MAX}
                        error={
                          config.negocio.telefono && !esTelefonoValido(config.negocio.telefono)
                            ? 'El teléfono debe tener entre 6 y 15 dígitos.'
                            : undefined
                        }
                        value={config.negocio.telefono}
                        onChange={(e) =>
                          actualizarNegocio({ telefono: sanitizarTelefonoInput(e.target.value) })
                        }
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
                        autoComplete="email"
                        maxLength={LIMITES_TEXTO.EMAIL_MAX}
                        error={
                          config.negocio.emailContacto && !esEmailValido(config.negocio.emailContacto)
                            ? 'Formato de correo inválido'
                            : undefined
                        }
                        value={config.negocio.emailContacto}
                        onChange={(e) =>
                          actualizarNegocio({
                            emailContacto: e.target.value.replace(/\s+/g, '').toLowerCase(),
                          })
                        }
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
                      <Scales className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
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
                          <FileText className="h-3.5 w-3.5 text-[#2A7A78]" weight="duotone" />
                          Comprobante Interno
                        </span>
                        {config.negocio.modoComprobante === 'no_fiscal' && (
                          <CheckCircle className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
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
                          <Scales className="h-3.5 w-3.5 text-[#2A7A78]" weight="duotone" />
                          Factura Electrónica
                        </span>
                        {config.negocio.modoComprobante === 'factura_afip' && (
                          <CheckCircle className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
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
                            maxLength={LIMITES_TEXTO.MENSAJE_TICKET_MAX}
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
                        <Warning className="h-4 w-4 text-amber-700" weight="duotone" />
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
                          type="text"
                          inputMode="numeric"
                          value={
                            campoEditandoVacio === 'puntoVenta'
                              ? ''
                              : String(config.negocio.puntoVenta || 1)
                          }
                          onChange={(e) => {
                            const limpio = sanitizarEnteroInput(e.target.value, 99999);
                            if (limpio === '' || limpio === '0') {
                              setCampoEditandoVacio('puntoVenta');
                            } else {
                              setCampoEditandoVacio(null);
                              actualizarNegocio({ puntoVenta: Math.max(1, parseInt(limpio, 10)) });
                            }
                          }}
                          onBlur={() => setCampoEditandoVacio(null)}
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
                    <Printer className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
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
                      maxLength={LIMITES_TEXTO.MENSAJE_TICKET_MAX}
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
                      maxLength={LIMITES_TEXTO.DESCRIPCION_MAX}
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

            {/* Columna Derecha: Vista Previa en Vivo del Ticket Térmico (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="border-[#E8E6DF] shadow-sm sticky top-6">
                <CardHeader className="pb-3 border-b border-[#E8E6DF] bg-[#F8F7F2]/60">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
                    <CardTitle className="text-sm font-bold text-[#1C2424]">
                      Simulador de Ticket Térmico ({config.pos.anchoPapelTicket || '80mm'})
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="p-4 bg-[#F2F1EA]/40">
                  {/* Papel Térmico Simulado */}
                  <div
                    className={`bg-white border border-[#D5D3C8] shadow-md rounded-md font-mono mx-auto leading-relaxed transition-all duration-200 ${
                      config.pos.anchoPapelTicket === '58mm'
                        ? 'max-w-[270px] p-3 text-[10px]'
                        : 'max-w-sm p-5 text-[11px]'
                    } text-[#2C3539]`}
                  >
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
                      <p className="text-[10px] text-[#4B5563] uppercase">
                        {config.negocio.condicionIva === 'responsable_inscripto'
                          ? 'IVA Responsable Inscripto'
                          : config.negocio.condicionIva === 'consumidor_final'
                          ? 'Consumidor Final'
                          : 'Responsable Monotributo'}
                      </p>
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

                      {/* Caja Destacada de Validez Legal según el Régimen y Condición IVA */}
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
                            {discriminaIvaFactura ? 'FACTURA B' : 'FACTURA C'}
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
                        <span>CAJA / TERMINAL:</span>
                        <span className="font-semibold">Caja #{config.pos.numeroCaja || 1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CAJERO:</span>
                        <span>Cajero de Turno</span>
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

                    {/* Totales matemáticamente coherentes según Régimen y Condición IVA */}
                    <div className="py-2.5 space-y-1 border-b border-dashed border-[#A0A8A8]">
                      {discriminaIvaFactura ? (
                        <>
                          <div className="flex justify-between text-[10px]">
                            <span>SUBTOTAL NETO:</span>
                            <span>{config.negocio.monedaSimbolo} 4.421,49</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span>IVA CONTENIDO (21%):</span>
                            <span>{config.negocio.monedaSimbolo} 928,51</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-[10px]">
                          <span>ARTÍCULOS:</span>
                          <span>3 un.</span>
                        </div>
                      )}
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

                      {config.negocio.modoComprobante === 'factura_afip' && (
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
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
  );
}
