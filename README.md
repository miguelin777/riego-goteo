# Diseñador de Sistema de Riego por Goteo por Gravedad

Herramienta web interactiva para diseñar, calcular y simular un sistema de riego por goteo asistido por gravedad. Desarrollada como entregable de un proyecto académico de **Física / Estadística** en **Querétaro, México**.

## Características

- **Esquema técnico SVG** — Diagrama interactivo del sistema que se actualiza en tiempo real.
- **Cálculos hidráulicos completos** — Bernoulli simplificado, Darcy-Weisbach, ecuación de orificio.
- **Simulación visual de flujo** — Animación SVG con gotas, control de velocidad, gráfica de caudales (Recharts).
- **Panel de parámetros editables** — Todos los valores se pueden ajustar con inputs y sliders.
- **Validaciones en tiempo real** — Alertas automáticas si hay configuraciones inválidas.
- **Lista de materiales auto-generada** — Se actualiza al cambiar parámetros.
- **Bosquejo del simulador** — Sección académica lista para el reporte.
- **Exportación** — PNG, SVG, JSON de parámetros, impresión (PDF vía navegador).
- **Persistencia** — Los parámetros se guardan en `localStorage`.

## Stack técnico

| Tecnología | Uso |
|---|---|
| Next.js 14 (App Router) | Framework React |
| TypeScript | Tipado estático |
| Tailwind CSS | Estilos |
| SVG inline | Esquema técnico y simulación |
| Recharts | Gráficas de distribución |
| html-to-image + file-saver | Exportación PNG/SVG |

## Instalación y ejecución

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Build de producción

```bash
npm run build
npm start
```

## Deploy en Vercel

El proyecto está listo para Vercel sin configuración adicional:

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # producción
```

O conecta el repositorio en [vercel.com](https://vercel.com) para deploys automáticos.

## Estructura del proyecto

```
src/
├── app/
│   ├── layout.tsx          # Layout raíz
│   ├── page.tsx            # Página principal
│   └── globals.css         # Estilos globales + Tailwind
├── components/
│   ├── AppShell.tsx        # Componente cliente principal (estado)
│   ├── ParamPanel.tsx      # Panel de parámetros editables
│   ├── TechnicalDiagramSVG.tsx  # Esquema técnico SVG
│   ├── FlowSimulationView.tsx   # Simulación animada + gráfica
│   ├── CalculationSteps.tsx     # Pasos de cálculo académico
│   ├── ResultsSummary.tsx       # Tabla resumen de resultados
│   ├── SimulationSketchSection.tsx # Bosquejo para la rúbrica
│   ├── MaterialsTable.tsx       # Lista de materiales
│   ├── ExportToolbar.tsx        # Botones de exportación
│   └── AlertsPanel.tsx          # Alertas/validaciones
└── lib/
    ├── types.ts            # Tipos TypeScript
    ├── defaults.ts         # Valores por defecto + localStorage
    ├── hydraulics.ts       # ★ FÓRMULAS (editar aquí)
    └── materials.ts        # Generador de lista de materiales
```

## Fórmulas utilizadas

| Fórmula | Expresión |
|---|---|
| Presión por gravedad | `P = ρ·g·h` |
| Bernoulli simplificado | `h = V²/2g + hL` → `V = √(2g(h − hL))` |
| Darcy-Weisbach | `hL = f·(L/D)·(V²/2g)` |
| Factor de fricción (laminar) | `f = 64/Re` |
| Factor de fricción (turbulento) | `f = 0.316/Re^0.25` (Blasius) |
| Ecuación de orificio | `q = Cd·A·√(2g·h_local)` |
| Uniformidad | `EU = (q_min / q_prom) × 100` |
| Demanda (ETc) | `ETc = Kc × ETo` (mm/día = L/m²·día) |

## Valores por defecto

| Parámetro | Valor | Unidad |
|---|---|---|
| Área de cultivo | 1.0 × 0.5 | m |
| Plantas | 4 | — |
| Altura del tanque (h) | 0.8 | m |
| Volumen del tanque | 10 | L |
| Ø tubería principal | 12 | mm |
| Ø tubería lateral | 8 | mm |
| Ø orificio emisor | 2 | mm |
| ETo | 4 | mm/día |
| Kc (jitomate) | 1.15 | — |
| Cd (descarga) | 0.62 | — |
| Tiempo de riego | 35 | min/día |
| Demanda por planta | 0.6 | L/planta·día |

## Dónde editar

- **Fórmulas y constantes**: `src/lib/hydraulics.ts`
- **Valores por defecto**: `src/lib/defaults.ts`
- **Lista de materiales**: `src/lib/materials.ts`
- **Tipos**: `src/lib/types.ts`

## Supuestos del modelo

- Flujo estacionario, fluido incompresible.
- ν ≈ 1.004×10⁻⁶ m²/s (agua a 20 °C).
- Emisor modelado como orificio (Cd = 0.62).
- P₁ ≈ P₂ ≈ Patm, V₁ ≈ 0 (tanque grande).
- Pérdidas menores agrupadas en hL configurable.

## Licencia

Proyecto académico. Uso libre con atribución.
