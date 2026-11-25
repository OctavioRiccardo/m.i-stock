'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  CreditCard,
  Money,
  DeviceMobile,
  Printer,
  SpeakerHigh,
  Barcode,
  HardDrive,
  Question,
  Receipt,
  QrCode,
} from '@phosphor-icons/react';
import { useAdminConfiguracionController } from '@/controllers/adminControllers/configuracionController';
import { AnchoPapelTicket } from '@/models/modelos_vista/configuracionModel';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { sanitizarEnteroInput } from '@/lib/validaciones';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SwitchToggle } from './SwitchToggle';

interface TabPosConfigProps {
  controller: ReturnType<typeof useAdminConfiguracionController>;
  campoEditandoVacio: string | null;
  setCampoEditandoVacio: (campo: string | null) => void;
}

export function TabPosConfig({
  controller,
  campoEditandoVacio,
  setCampoEditandoVacio,
}: TabPosConfigProps) {
  const { config, actualizarPOS, toggleMetodoPago } = controller;

  return (
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
                    <CreditCard className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Money className="h-5 w-5" weight="duotone" />
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
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <CreditCard className="h-5 w-5" weight="duotone" />
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
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <CreditCard className="h-5 w-5" weight="duotone" />
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
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <DeviceMobile className="h-5 w-5" weight="duotone" />
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
                        Billeteras virtuales (MODO, Cuenta DNI, BNA+) y transferencias bancarias.
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

                  {/* Tarjeta 5: Mercado Pago */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      config.pos.metodosPagoHabilitados.mercado_pago
                        ? 'border-[#2A7A78] bg-[#E2F1F0]/25'
                        : 'border-[#E8E6DF] bg-[#F8F7F2]/40 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          config.pos.metodosPagoHabilitados.mercado_pago
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <QrCode className="h-5 w-5" weight="duotone" />
                      </div>
                      <SwitchToggle
                        id="toggle-mercadopago"
                        checked={config.pos.metodosPagoHabilitados.mercado_pago}
                        onChange={() => toggleMetodoPago('mercado_pago')}
                        label="Habilitar Mercado Pago"
                      />
                    </div>
                    <div className="mt-3">
                      <p className="font-bold text-xs text-[#1C2424]">Mercado Pago</p>
                      <p className="text-[11px] text-[#657373] mt-0.5">
                        Cobros integrados vía QR dinámico, Point Smart o checkout digital.
                      </p>
                    </div>
                    <div className="mt-3">
                      <Badge
                        variant={config.pos.metodosPagoHabilitados.mercado_pago ? 'success' : 'secondary'}
                        className="text-[10px]"
                      >
                        {config.pos.metodosPagoHabilitados.mercado_pago ? 'Habilitado' : 'Deshabilitado'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sección: Políticas Operativas de Venta y Periféricos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card: Control de Stock en Caja */}
              <Card className="border-[#E8E6DF] shadow-sm">
                <CardHeader className="pb-3 border-b border-[#E8E6DF]">
                  <CardTitle className="text-sm font-bold text-[#1C2424]">
                    Control de Stock en Caja
                  </CardTitle>
                  <p className="text-xs text-[#657373]">
                    Define cómo actúa la caja cuando un producto se queda sin unidades cargadas.
                  </p>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Switch: Permitir venta sin stock */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-[#1C2424]">
                          Permitir vender productos sin stock
                        </p>
                        {config.pos.permitirVentaSinStock && (
                          <Badge variant="warning" className="text-[10px]">
                            Activado
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[#657373] mt-1">
                        Si está desactivado (recomendado), el cajero solo puede vender las unidades que figuren disponibles en el inventario. Si lo activás, podrá cobrar igual aunque todavía no hayas cargado el ingreso de mercadería.
                      </p>
                    </div>
                    <SwitchToggle
                      id="toggle-ventasin-stock"
                      checked={config.pos.permitirVentaSinStock}
                      onChange={(val) => actualizarPOS({ permitirVentaSinStock: val })}
                      label="Permitir venta sin stock"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-[#F8F7F2] border border-[#E8E6DF] flex items-start gap-2.5">
                    <Question className="h-4 w-4 text-[#2A7A78] mt-0.5 shrink-0" weight="duotone" />
                    <p className="text-[11px] text-[#657373]">
                      El cambio se aplica en el acto en la pantalla de cobro sin necesidad de cerrar la caja.
                    </p>
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
                        <SpeakerHigh className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
                        <p className="text-xs font-semibold text-[#1C2424]">
                          Sonido de Confirmación al Cobrar
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
                          <Barcode className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
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

                  <div className="border-t border-[#E8E6DF] pt-4">
                    {/* Switch: Impresión Automática de Ticket */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Printer className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
                          <p className="text-xs font-semibold text-[#1C2424]">
                            Impresión Automática de Ticket al Cobrar
                          </p>
                        </div>
                        <p className="text-xs text-[#657373] mt-1">
                          Abre automáticamente el diálogo de impresión al confirmar cada venta en la terminal de mostrador.
                        </p>
                      </div>
                      <SwitchToggle
                        id="toggle-auto-imprimir"
                        checked={config.pos.autoImprimirTicket}
                        onChange={(val) => actualizarPOS({ autoImprimirTicket: val })}
                        label="Impresión automática de ticket"
                      />
                    </div>
                  </div>

                  <div className="border-t border-[#E8E6DF] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Receipt className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
                        <label className="text-xs font-semibold text-[#1C2424]">
                          Ancho de Papel de Ticket
                        </label>
                      </div>
                      <select
                        value={config.pos.anchoPapelTicket || '80mm'}
                        onChange={(e) => actualizarPOS({ anchoPapelTicket: e.target.value as AnchoPapelTicket })}
                        className="flex h-9 w-full rounded-md border border-[#E8E6DF] bg-white px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2A7A78] text-[#1C2424]"
                      >
                        <option value="80mm">80 mm (Estándar Térmico POS)</option>
                        <option value="58mm">58 mm (Mini Térmico / Bluetooth)</option>
                      </select>
                      <p className="text-[10px] text-[#657373] mt-1">
                        Ajusta el margen y tamaño tipográfico del comprobante.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <HardDrive className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
                        <label className="text-xs font-semibold text-[#1C2424]">
                          Número de Terminal / Caja
                        </label>
                      </div>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={
                          campoEditandoVacio === 'numeroCaja'
                            ? ''
                            : String(config.pos.numeroCaja || 1)
                        }
                        onChange={(e) => {
                          const limpio = sanitizarEnteroInput(e.target.value, 99);
                          if (limpio === '' || limpio === '0') {
                            setCampoEditandoVacio('numeroCaja');
                          } else {
                            setCampoEditandoVacio(null);
                            actualizarPOS({ numeroCaja: Math.max(1, parseInt(limpio, 10)) });
                          }
                        }}
                        onBlur={() => setCampoEditandoVacio(null)}
                        className="h-9 text-xs"
                      />
                      <p className="text-[10px] text-[#657373] mt-1">
                        Número de punto o puesto físico asignado a esta máquina.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
  );
}
