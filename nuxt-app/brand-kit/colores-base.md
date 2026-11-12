# Kenko EPS — Colores base y estilos para la página de acceso

Guía mínima para replicar el estilo visual de `kenko-web` en otro repositorio
(p. ej. la página de acceso / login).

Fuente de verdad: `src/styles/global.css`.

## 1. Paleta base

| Token        | Hex     | Uso principal                                              |
| ------------ | ------- | ---------------------------------------------------------- |
| `background` | `#f9fafb` | Fondo general de página                                  |
| `content`    | `#18181b` | Texto principal sobre fondos claros                      |
| `primary`    | `#21496a` | Color principal Kenko (header, botones primarios, títulos) |
| `secondary`  | `#ffb51b` | Acento amarillo (CTAs, foco, detalles)                   |
| `accent`     | `#1e5bd7` | Acento azul para enlaces y estados interactivos          |

Texto sobre colores sólidos:

| Fondo       | Texto       | Hex     |
| ----------- | ----------- | ------- |
| `primary`   | `on-primary`   | `#f9fafb` |
| `secondary` | `on-secondary` | `#18181b` |
| `accent`    | `on-accent`    | `#f9fafb` |

### Variante "Nosotros" (solo secciones institucionales)

| Token            | Hex     |
| ---------------- | ------- |
| `about-primary`  | `#466883` |
| `about-secondary`| `#dbbc78` |
| `about-accent`   | `#6386cd` |
| `on-about-primary`   | `#f9fafb` |
| `on-about-secondary` | `#18181b` |
| `on-about-accent`    | `#f9fafb` |

> Para la página de acceso usa solo la paleta base. La variante `about-*`
> es para páginas institucionales.

## 2. CSS variables (copiar/pegar)

```css
:root {
  --background: #f9fafb;
  --content: #18181b;

  --primary: #21496a;
  --secondary: #ffb51b;
  --accent: #1e5bd7;

  --on-primary: #f9fafb;
  --on-secondary: #18181b;
  --on-accent: #f9fafb;
}
```

Con Tailwind CSS 4 el proyecto las expone así (`src/styles/global.css`):

```css
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-content: var(--content);
  --color-primary: var(--primary);
  --color-secondary: var(--secondary);
  --color-accent: var(--accent);

  --color-on-primary: var(--on-primary);
  --color-on-secondary: var(--on-secondary);
  --color-on-accent: var(--on-accent);
}
```

Esto habilita clases como `bg-primary`, `text-on-primary`,
`bg-secondary`, `text-content`, `bg-background`, etc.

## 3. Tipografías

| Rol      | Familia | Archivo en `brand-kit/fuentes/`              | Variable CSS      |
| -------- | ------- | -------------------------------------------- | ----------------- |
| Títulos  | Figtree | `figtree-latin-wght-normal.woff2`            | `--font-figtree`  |
| Títulos itálica (opcional) | Figtree Italic | `figtree-latin-wght-italic.woff2` | — |
| Cuerpo   | Manrope | `manrope-latin-wght-normal.woff2`            | `--font-manrope`  |

- Ambas son **variables** con peso `100 900`, estilo `normal` (más itálica en Figtree).
- En `kenko-web` se cargan como fuentes locales con Astro Fonts
  (`astro.config.mjs` → `fontProviders.local()`):

```js
fonts: [
  {
    provider: fontProviders.local(),
    name: "Manrope",
    cssVariable: "--font-manrope",
  },
  {
    provider: fontProviders.local(),
    name: "Figtree",
    cssVariable: "--font-figtree",
  },
],
```

- Mapeo semántico usado en Tailwind:

```css
@theme inline {
  --font-display: var(--font-figtree);
  --font-body: var(--font-manrope);
}
```

Clases resultantes: `font-display` (títulos), `font-body` (texto).

Si no usas Astro Fonts, declara los `@font-face` manualmente apuntando
a los `.woff2` de `brand-kit/fuentes/` con `font-weight: 100 900`.

## 4. Logos incluidos (`brand-kit/logos/`)

| Archivo                  | Uso en `kenko-web`                          |
| ------------------------ | ------------------------------------------- |
| `kenko_limpio.svg`       | Logo principal (navbar, footer)              |
| `favicon.svg` / `favicon.ico` | Favicon del sitio                        |
| `logo-supersalud.svg`    | Logo Supersalud (footer legal)               |
| `min-salud-logo.png`     | Logo Ministerio de Salud (footer legal)      |
| `vigilado-supersalud.png`| Sello "Vigilado Supersalud" (footer legal)  |

> `kenko_limpio.svg` es el logo en uso actual. No se incluye `kenko.svg`
> (6.8 MB trazado, en desuso) ni `logo-kenko.svg` (trazado antiguo).

## 5. Ejemplo rápido (login)

- Fondo: `background` (`#f9fafb`)
- Tarjeta: blanca con borde `content/10`
- Título: `font-display`, color `primary`
- Botón primario: `bg-primary text-on-primary`, hover `bg-primary/90`
- Foco visible: `outline-secondary`
- Enlaces: `text-accent`
