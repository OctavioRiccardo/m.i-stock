# 🎙️ Guión de Exposición Oral: Defensa de Trabajo Final (PTS)
## Sistema miStock — Plataforma Web de Gestión de Inventario, Punto de Venta (POS) y Catálogo Comercial

* **Postulante:** Octavio Riccardo  
* **Carrera:** Tecnicatura Universitaria en Web (TUW)  
* **Materia:** Trabajo Final / Práctica Técnica Supervisada (PTS)  
* **Año Académico:** 2026  
* **Tiempo Total Estimado:** 15 a 18 minutos de exposición + 5 a 10 minutos de preguntas del Jurado  

---

## ⏱️ Estructura y Distribución de Tiempos

| Bloque Temático | Diapositivas | Enfoque Principal | Tiempo Estimado |
| :--- | :---: | :--- | :---: |
| **1. Introducción y Contexto** | Diapos 1 - 3 | Presentación, problemática comercial y objetivos del proyecto. | 2:30 min |
| **2. Arquitectura y Fundamentos Técnicos** | Diapos 4 - 6 | Patrón MVC en React 19, base de datos PostgreSQL, RLS y seguridad. | 4:00 min |
| **3. Módulos del Sistema y Reglas de Negocio** | Diapos 7 - 9 | Terminal POS, ciclo de caja, catálogo, rentabilidad y métricas KPIs. | 4:30 min |
| **4. Demostración Práctica en Vivo (Live Demo)** | Diapo 10 | Flujo completo: Apertura → Cobro POS → Stock → Métricas → Cierre. | 3:30 min |
| **5. Conclusiones y Trabajo Futuro** | Diapos 11 - 12 | Logros alcanzados, lecciones aprendidas y preguntas del tribunal. | 2:00 min |
| **Total Exposición** | **12 Diapositivas** | **Presentación Fluida y Rigurosa** | **~16:30 min** |

---

## 🖥️ Guión Detallado Diapositiva por Diapositiva

---

### Diapositiva 1: Portada Institucional y Presentación
* **Tiempo sugerido:** 0:45 min
* **Contenido Visual de la Diapositiva:**
  - Título: **miStock** — Sistema Web de Gestión de Inventario, Punto de Venta (POS) y Catálogo Comercial.
  - Subtítulo: *Defensa de Trabajo Final / Práctica Técnica Supervisada*.
  - Datos: Postulante: Octavio Riccardo | Carrera: Tecnicatura Universitaria en Web | Año: 2026.
  - Isotipo y paleta visual del proyecto (Verde Esmeralda `#2A7A78` y Slate profesional).

#### 🗣️ Guión del Orador ("Qué decir"):
> "Buenos días / tardes a los miembros del tribunal evaluador, profesores y presentes.  
> Mi nombre es Octavio Riccardo y a continuación voy a presentar mi Trabajo Final para la Tecnicatura Universitaria en Web, titulado: **miStock: Sistema Web de Gestión de Inventario, Punto de Venta y Catálogo Comercial**.
>
> Este proyecto nace de una necesidad tangible observada en el comercio minorista contemporáneo: la brecha entre sistemas de gestión tradicionales y costosos, y la agilidad que exige la atención diaria en el mostrador.  
> A lo largo de esta presentación abordaremos el problema de negocio, la arquitectura técnica seleccionada, las reglas de negocio implementadas y una demostración funcional del sistema."

---

### Diapositiva 2: El Problema en el Comercio Minorista
* **Tiempo sugerido:** 1:15 min
* **Contenido Visual de la Diapositiva:**
  - 4 pilares del dolor comercial:
    1. **Quiebres de Stock:** Ventas perdidas por falta de alertas tempranas.
    2. **Capital Inmovilizado:** Mercadería estancada con baja rotación sin visibilidad contable.
    3. **Fricción en Mostrador:** Demoras al cobrar con múltiples medios de pago y errores manuales de vuelto.
    4. **Falta de Trazabilidad y Seguridad:** Descuadres de caja ciego y fuga de información sin roles de acceso.
  - Frase destacada: *"La falta de integración entre el inventario y la terminal de cobro genera pérdidas económicas y desinformación operativa."*

#### 🗣️ Guión del Orador ("Qué decir"):
> "Para comprender el origen de miStock, analizamos la operativa diaria de los pequeños y medianos comercios. Nos encontramos recurrentemente con cuatro problemas críticos:
> 
> En primer lugar, los **quiebres de stock no anticipados**, donde el comerciante se entera de que no tiene producto cuando el cliente ya está frente al mostrador.  
> En segundo lugar, el **capital inmovilizado**: dinero atrapado en estanterías sin rotación comercial que deteriora la liquidez del negocio.  
> En tercer lugar, la **fricción al cobrar**: la adopción de medios de pago electrónicos y billeteras virtuales suele fragmentar el proceso de cobro en múltiples posnets o cuadernos, provocando errores en el cálculo de vueltos y demoras innecesarias.  
> Y finalmente, la **inseguridad operativa**: cajas que se cierran sin arqueo formal y falta de control sobre qué permisos tiene cada empleado.
> 
> Frente a este escenario, el desafío fue diseñar una solución web moderna, rápida y accesible desde cualquier dispositivo, sin la complejidad de los ERPs tradicionales."

---

### Diapositiva 3: Objetivos del Proyecto y Propuesta de Valor
* **Tiempo sugerido:** 1:00 min
* **Contenido Visual de la Diapositiva:**
  - **Objetivo General:** Desarrollar una aplicación web integral, reactiva y desacoplada que sincronice en tiempo real el inventario de depósito con la terminal de cobro POS.
  - **Objetivos Específicos (Iconos clave):**
    - ⚡ *Terminal POS de alta velocidad*: Carrito optimizado, validación de stock físico y emisión de tickets térmicos (80mm).
    - 💳 *Integración de Hardware de Pago*: Conexión directa con terminales físicas Mercado Pago Point Smart.
    - 📊 *Métricas Financieras en Tiempo Real*: Margen bruto, recaudación y ticket promedio con granularidad analítica.
    - 🛡️ *Seguridad Relacional Estricta*: Control de acceso basado en roles (RBAC) y políticas de integridad en base de datos.

#### 🗣️ Guión del Orador ("Qué decir"):
> "El objetivo general de este trabajo fue desarrollar una solución integral que una, en una sola plataforma, la gestión estratégica del administrador con la velocidad operativa del cajero en el punto de venta.
>
> Para lograrlo, nos propusimos cuatro objetivos específicos:
> Primero: construir un Punto de Venta ultrarrápido, capaz de operar por teclado o pantalla táctil, validando existencias al instante.  
> Segundo: integrar terminales físicas de pago mediante la API de Mercado Pago Point Smart, automatizando el envío de cobros sin carga manual.  
> Tercero: proveer un tablero de control con métricas financieras reales que informe sobre la rentabilidad del negocio.  
> Y cuarto: garantizar una arquitectura de datos robusta, donde la integridad del stock y la seguridad no dependan solo de la interfaz, sino que estén blindadas a nivel de base de datos."

---

### Diapositiva 4: Arquitectura del Sistema — Patrón MVC en React Moderno
* **Tiempo sugerido:** 1:30 min
* **Contenido Visual de la Diapositiva:**
  - Diagrama de Arquitectura MVC Adaptada:
    - **Modelos (`src/models/`):** Doble capa (Modelos de Dominio vs. Modelos de Vista / DTOs).
    - **Controladores (`src/controllers/`):** Custom Hooks desacoplados de React 19 (`useUserDashboardController`, `useInventarioController`, etc.).
    - **Vistas (`src/views/`):** Componentes puramente declarativos que solo consumen el contrato del controlador.
    - **Servicios (`src/services/`):** Almacenes de sincronización (`useSyncExternalStore`) y conector Supabase.
  - Callout destacado: *0% lógica de negocio en la capa visual; 100% testeable y modular.*

#### 🗣️ Guión del Orador ("Qué decir"):
> "Uno de los mayores aportes de ingeniería en este trabajo es cómo trasladamos el patrón **Modelo-Vista-Controlador (MVC)** tradicional al ecosistema moderno de React 19 y Next.js.
>
> En miStock, la interfaz de usuario está estrictamente desacoplada de la lógica de negocio:
> - Los **Modelos** definen una arquitectura de doble capa: por un lado, los *Modelos de Dominio*, que reflejan fielmente las tablas de la base de datos relacional; y por otro, los *Modelos de Vista*, que tipifican formularios, estados efímeros y métricas calculadas.
> - Los **Controladores** están implementados mediante *Custom Hooks* de React. Toda la reactividad, las validaciones comerciales y las llamadas asíncronas residen aquí. La vista no sabe cómo se calcula un arqueo ni cómo se guarda una venta; solo invoca las funciones del controlador.
> - Las **Vistas** son puramente presentacionales y consumen un único contrato devuelto por el hook.
> - Y los **Servicios** gestionan la sincronización reactiva utilizando `useSyncExternalStore`, asegurando que cualquier cambio en el inventario o la caja se propague instantáneamente sin inconsistencias de estado."

---

### Diapositiva 5: Stack Tecnológico y Justificación de Herramientas
* **Tiempo sugerido:** 1:15 min
* **Contenido Visual de la Diapositiva:**
  - Grilla de Tecnologías:
    - **Frontend:** Next.js 16 (App Router / Turbopack), React 19, TypeScript 5 (Modo estricto).
    - **UI / Estilos:** Tailwind CSS v4, componentes Radix UI / shadcn/ui, Phosphor Icons, Framer Motion.
    - **Visualización:** Recharts (Gráficos analíticos de recaudación y rotación).
    - **Backend & Persistencia:** Supabase (PostgreSQL 15), Supabase Auth (JWT), Triggers PL/pgSQL.
    - **Hardware e Integración:** Mercado Pago Point Smart API + Impresión térmica estándar ESC/POS (80mm).

#### 🗣️ Guión del Orador ("Qué decir"):
> "La elección del stack técnico respondió a criterios de rendimiento, tipado estático y experiencia de usuario.
>
> En el frontend elegimos **Next.js 16 con React 19 y TypeScript 5 estricto**. Esto nos brinda renderizado optimizado, navegación instantánea y la certeza de detectar cualquier error en tiempo de compilación.  
> Para la interfaz implementamos **Tailwind CSS v4** junto con **Radix UI** y **Phosphor Icons**, logrando una estética visual inspirada en herramientas B2B de primer nivel, accesible y altamente responsiva.
>
> Para el backend y persistencia optamos por **Supabase sobre PostgreSQL 15**, aprovechando la potencia del motor relacional más maduro del mercado.  
> Finalmente, para el hardware integramos terminales **Mercado Pago Point Smart** y soporte nativo para **impresoras térmicas de 80mm** mediante hojas de estilo dedicadas `@media print`."

---

### Diapositiva 6: Base de Datos, Integridad Relacional y Seguridad (RLS)
* **Tiempo sugerido:** 1:15 min
* **Contenido Visual de la Diapositiva:**
  - Esquema Relacional de PostgreSQL: Tablas `productos`, `categorias`, `ventas`, `detalle_ventas`, `cierres_caja`.
  - Mecanismos de Integridad:
    - Claves foráneas `NOT NULL` con `ON DELETE RESTRICT` (sin productos huérfanos).
    - Restricciones `CHECK` para precios, costos y stocks no negativos.
    - **Trigger Automático:** `tr_cancelar_venta_reintegrar_stock` (reingreso automático de mercadería a depósito al anular un ticket).
  - Seguridad: **Row Level Security (RLS)** y autenticación mediante JWT (`auth.users`).

#### 🗣️ Guión del Orador ("Qué decir"):
> "La confiabilidad de un sistema comercial reside en su base de datos. En miStock, la integridad de los datos está garantizada en el propio motor PostgreSQL:
> 
> En primer lugar, implementamos **integridad referencial estricta**: ningún producto puede existir sin categoría asignada y ninguna categoría con productos vinculados puede ser eliminada, evitando inconsistencias relacionales.  
> En segundo lugar, creamos **triggers de base de datos**. Por ejemplo, cuando una venta es anulada, un trigger en PostgreSQL detecta el cambio de estado y automáticamente reingresa las unidades de cada ítem al stock físico, garantizando consistencia absoluta incluso ante fallas de red.  
> En cuanto a la seguridad, implementamos **Row Level Security (RLS)** combinado con Supabase Auth. Las políticas validan a nivel de fila que solo usuarios con rol de administrador puedan modificar configuraciones o ver métricas globales, mientras que los vendedores solo acceden a las operaciones de caja."

---

### Diapositiva 7: Módulo Punto de Venta (POS) y Hardware de Cobro
* **Tiempo sugerido:** 1:30 min
* **Contenido Visual de la Diapositiva:**
  - Capturas de la Terminal POS:
    - Apertura de caja con fondo inicial.
    - Buscador rápido por código de barras / nombre y atajos de teclado.
    - Modal de cobro multimétodo: cálculo automático de vuelto con botones sugeridos de billetes.
    - Integración Mercado Pago Point: flujo de envío a terminal física y polling reactivo de estado.
    - Ticket térmico de 80mm y modal de retroalimentación *"¡Venta Completada!"*.

#### 🗣️ Guión del Orador ("Qué decir"):
> "Pasando al corazón operativo del sistema, la **Terminal de Punto de Venta**:  
> El cajero inicia su turno mediante un modal de **Apertura de Caja**, donde declara obligatoriamente su fondo inicial de cambio. Sin caja abierta, el sistema bloquea cualquier venta.
> 
> Durante la atención, el carrito permite agregar ítems mediante lector de código de barras o búsqueda predictiva. Cada producto valida en tiempo real las existencias disponibles según la política comercial configurada.
> 
> Al momento de cobrar:
> - Si es **Efectivo**, el sistema calcula el vuelto exacto y ofrece botones inteligentes con las denominaciones de billetes más probables.
> - Si es **Mercado Pago Point Smart**, el sistema envía la orden a la terminal inalámbrica física del mostrador y consulta su estado en vivo, habilitando la confirmación únicamente cuando el cliente apoya su tarjeta o escanea el QR y la operación resulta aprobada.
> 
> Al finalizar, se emite el **ticket térmico de 80mm** con diseño ESC/POS y, al cerrar o imprimir, un modal de retroalimentación confirma que el stock fue descontado y la caja quedó lista para el siguiente cliente."

---

### Diapositiva 8: Catálogo, Control de Inventario y Rentabilidad
* **Tiempo sugerido:** 1:15 min
* **Contenido Visual de la Diapositiva:**
  - Capturas de Gestión de Inventario:
    - Alta y edición de producto con cálculo dinámico de rentabilidad (`% Margen Bruto` = `(Precio - Costo) / Precio`).
    - Semáforo visual de stock: Verde (Óptimo), Ámbar (Stock Mínimo), Rojo (Agotado).
    - Modal de Ajuste Rápido de Stock con auditoría de motivo (Rotura, Vencimiento, Ajuste de Conteo).

#### 🗣️ Guión del Orador ("Qué decir"):
> "En el panel de administración encontramos la **Gestión de Inventario y Catálogo**.  
> Aquí resolvimos un error muy común en el comercio: fijar precios sin conocer el margen real. Al ingresar un artículo, el administrador define el costo y el precio de venta, y el sistema calcula automáticamente en tiempo real el porcentaje de rentabilidad y margen bruto, alertando si el precio no cubre los costos.
> 
> Además, contamos con un **semáforo de stock reactivo**:
> - Verde cuando las existencias son saludables.
> - Ámbar cuando se alcanza el umbral de stock mínimo.
> - Y rojo cuando el artículo entra en stock crítico o agotado.
> 
> El administrador puede realizar ajustes manuales de stock auditados (por ejemplo por rotura o conteo físico), quedando cada movimiento registrado para garantizar la trazabilidad."

---

### Diapositiva 9: Tablero de Control y Métricas de Negocio (KPIs)
* **Tiempo sugerido:** 1:15 min
* **Contenido Visual de la Diapositiva:**
  - Dashboard Administrativo:
    - Tarjetas KPI: Recaudación del Período, Ticket Promedio, Unidades Despachadas, Capital Inmovilizado.
    - Selector de Granularidad Temporal: *Hoy (6 franjas de 4h)*, *7 Días*, *30 Días*, *Anual (12 meses)*.
    - Gráfico comparativo de área (`Recharts`): Ventas del período actual vs. período anterior.
    - Gráfico de distribución de ingresos por categoría comercial.

#### 🗣️ Guión del Orador ("Qué decir"):
> "Para que el dueño del comercio tome decisiones estratégicas basadas en datos, diseñamos el **Dashboard de Métricas y KPIs**.
>
> El panel cuenta con cuatro métricas de alto impacto:
> 1. **Recaudación Neta**, con comparativa porcentual contra el ciclo anterior.
> 2. **Ticket Promedio**, que permite evaluar la efectividad de promociones.
> 3. **Unidades Despachadas**, para medir el volumen de rotación.
> 4. Y **Capital Inmovilizado**, que cuantifica en moneda corriente el dinero retenido en depósito valorizado a precio de costo.
> 
> Lo más destacado es que estas métricas admiten **cuatro granularidades temporales**: Hoy en bloques de 4 horas, Últimos 7 Días, Últimos 30 Días y Vista Anual, adaptando los ejes y agrupamientos de los gráficos de manera totalmente reactiva."

---

### Diapositiva 10: Demostración Práctica en Vivo (Live Demo)
* **Tiempo sugerido:** 3:30 min
* **Contenido Visual de la Diapositiva:**
  - Título: **Demostración Práctica del Sistema en Vivo**
  - Pasos del circuito a demostrar:
    1. *Paso 1:* Apertura de caja con fondo inicial en la terminal POS.
    2. *Paso 2:* Carga de artículos al carrito y cobro en mostrador (Efectivo / Point).
    3. *Paso 3:* Emisión de comprobante térmico y confirmación de venta.
    4. *Paso 4:* Verificación instantánea del descuento de stock y actualización en Métricas Admin.
    5. *Paso 5:* Arqueo y Cierre de Turno (Reporte Z oficial).

#### 🗣️ Guión del Orador ("Qué decir"):
> "Para ver cómo todos estos componentes convergen en la práctica, realizaremos una breve demostración en vivo del circuito operativo completo:
> 
> *(Cambiar a la ventana del navegador con la aplicación en vivo en `localhost:3000`)*
> 
> 1. **Apertura de Turno:** Ingresamos al POS con perfil de vendedor. Vemos que el sistema solicita abrir caja. Ingresamos un fondo inicial de $10.000. La caja queda habilitada.
> 2. **Venta en Mostrador:** Buscamos dos productos y los agregamos al carrito. Observen cómo el sistema nos muestra el stock restante. Presionamos 'Cobrar'.
> 3. **Cobro:** Seleccionamos Efectivo, ingresamos el billete recibido, verificamos el cálculo del vuelto y confirmamos.
> 4. **Ticket y Feedback:** Se genera el ticket térmico de 80mm con datos fiscales congelados y, al finalizar, el modal confirma la venta exitosa.
> 5. **Impacto en Tiempo Real:** Pasamos a la vista de Administrador: observamos cómo el stock físico ya se descontó en depósito y la recaudación del día en el gráfico de métricas se actualizó automáticamente sin necesidad de recargar la página.
> 6. **Cierre de Caja:** Volvemos al POS e iniciamos el Arqueo de Caja. Ingresamos el conteo físico, el sistema valida la conciliación del dinero y genera el **Reporte Z de Cierre** con la firma del cajero y administrador."

---

### Diapositiva 11: Conclusiones y Logros del Trabajo
* **Tiempo sugerido:** 1:00 min
* **Contenido Visual de la Diapositiva:**
  - Puntos clave alcanzados:
    - ✅ **Arquitectura desacoplada y escalable:** Adopción exitosa de MVC estricto con Custom Hooks en React 19.
    - ✅ **Integridad relacional garantizada:** Triggers y RLS en PostgreSQL 15, evitando datos huérfanos y garantizando consistencia en anulaciones.
    - ✅ **Experiencia de usuario de alta velocidad:** Tiempos de respuesta inmediatos en el cobro y feedback claro en mostrador.
    - ✅ **Integración de hardware real:** Mercado Pago Point Smart y tickets térmicos ESC/POS 80mm.

#### 🗣️ Guión del Orador ("Qué decir"):
> "Como conclusiones de este Trabajo Final, puedo destacar tres logros fundamentales:
> 
> En primer lugar, demostramos que es totalmente viable implementar una arquitectura **MVC rigurosa en el frontend moderno**, manteniendo el código ordenado, desacoplado y fácil de mantener.  
> En segundo lugar, logramos un producto que combina la **velocidad requerida en un mostrador físico** con la **rigurosidad analítica que exige un dueño de negocio**.  
> Y en tercer lugar, validamos que la seguridad e integridad del negocio no deben dejarse en manos del cliente, sino delegarse con firmeza en el motor de base de datos relacional."

---

### Diapositiva 12: Trabajo Futuro, Agradecimientos y Cierre
* **Tiempo sugerido:** 1:00 min
* **Contenido Visual de la Diapositiva:**
  - Líneas de Trabajo Futuro:
    - 🧾 Integración con Web Services de Facturación Electrónica (AFIP / ARCA - CAE directo).
    - 🏢 Soporte Multi-Sucursal y Depósitos Centralizados con transferencias internas.
    - 📱 Aplicación PWA Offline-First con sincronización en segundo plano.
  - Mensaje final: *"Muchas gracias por su tiempo y atención. Quedo a disposición de las preguntas del tribunal."*
  - Datos de contacto y repositorio del proyecto.

#### 🗣️ Guión del Orador ("Qué decir"):
> "Como líneas de trabajo futuro para continuar evolucionando miStock, se proyecta la homologación directa de comprobantes fiscales con el web service de **Facturación Electrónica de AFIP/ARCA**, el soporte para comercios **multi-sucursal** con depósitos descentralizados, y la incorporación de capacidades **Offline-First** para continuar vendiendo incluso ante cortes de suministro de internet.
> 
> Quiero agradecer a los docentes de la carrera por los conocimientos brindados y a los miembros del jurado por su tiempo y escucha atenta.  
> Quedo a su entera disposición para responder sus preguntas."

---

## 🎯 Consejos Estratégicos para el Día de la Defensa

1. **Ritmo y Respiración:** No te apures. Es preferible hablar pausado, con pausas de 2 segundos entre conceptos clave, que acelerar por nerviosismo.
2. **Postura ante Preguntas Técnicas del Jurado:**
   - *Si preguntan por qué MVC en React:* Explica que los componentes tienden a acumular lógica de negocio (`useEffect`, llamadas a APIs, estados derivados), volviéndose inmanejables; desacoplar los Hooks como controladores hace que las vistas sean intercambiables y los controladores 100% testeables sin montar el DOM.
   - *Si preguntan por la anulación de ventas:* Destaca el trigger `tr_cancelar_venta_reintegrar_stock` en PostgreSQL, explicando que la reversión de stock no se confía al frontend, sino a una transacción atómica en el motor relacional.
   - *Si preguntan por qué Point Smart:* Explica que el modelo Smart POS con REST API y Webhooks permite cobrar con cualquier tarjeta o QR sin requerir SDKs nativos ni Bluetooth, funcionando en cualquier navegador web.
3. **Respaldo para la Live Demo:** Ten la aplicación corriendo previamente en `http://localhost:3000` con usuarios ya creados (un `admin` y un `vendedor`) en dos navegadores o pestañas de incógnito separadas para no perder tiempo logueándote en vivo.
