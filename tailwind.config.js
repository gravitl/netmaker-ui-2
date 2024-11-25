/** @type {import('tailwindcss').Config} */

export default {
  // darkMode: 'class', // {{ edit_1 }}
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        white: 'var(--color-white)',
        black: 'var(--color-black)',
        transparent: 'var(--color-transparent)',

        neutral: {
          50: 'var(--color-neutral-50)',
          100: 'var(--color-neutral-100)',
          150: 'var(--color-neutral-150)',
          200: 'var(--color-neutral-200)',
          300: 'var(--color-neutral-300)',
          400: 'var(--color-neutral-400)',
          500: 'var(--color-neutral-500)',
          600: 'var(--color-neutral-600)',
          700: 'var(--color-neutral-700)',
          750: 'var(--color-neutral-750)',
          800: 'var(--color-neutral-800)',
          850: 'var(--color-neutral-850)',
          900: 'var(--color-neutral-900)',
          950: 'var(--color-neutral-950)',
        },

        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
        },

        success: 'var(--color-success)',
        critical: 'var(--color-critical)',

        bg: {
          default: 'var(--color-bg-default)',
          hover: 'var(--color-bg-hover)',
          contrastDefault: 'var(--color-bg-contrast-default)',
          contrastHover: 'var(--color-bg-contrast-hover)',
        },

        stroke: {
          default: 'var(--color-stroke-default)',
          hover: 'var(--color-stroke-hover)',
          active: 'var(--color-stroke-active)',
          error: 'var(--color-stroke-error)',
        },

        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          disabled: 'var(--color-text-disabled)',
          success: 'var(--color-text-success)',
          critical: 'var(--color-text-critical)',
        },

        button: {
          primary: {
            fill: {
              default: 'var(--color-button-primary-fill-default)',
              hover: 'var(--color-button-primary-fill-hover)',
              disabled: 'var(--color-button-primary-fill-disabled)',
            },
            text: {
              default: 'var(--color-button-primary-text-default)',
              disabled: 'var(--color-button-primary-text-disabled)',
            },
          },
          plain: {
            fill: {
              default: 'var(--color-button-plain-fill-default)',
              hover: 'var(--color-button-plain-fill-hover)',
              disabled: 'var(--color-button-plain-fill-disabled)',
            },
            text: {
              default: 'var(--color-button-plain-text-default)',
              disabled: 'var(--color-button-plain-text-disabled)',
            },
          },
          secondary: {
            fill: {
              default: 'var(--color-button-secondary-fill-default)',
              hover: 'var(--color-button-secondary-fill-hover)',
              disabled: 'var(--color-button-secondary-fill-disabled)',
            },
            text: {
              default: 'var(--color-button-secondary-text-default)',
              disabled: 'var(--color-button-secondary-text-disabled)',
            },
          },
          outline: {
            fill: {
              default: 'var(--color-button-outline-fill-default)',
              hover: 'var(--color-button-outline-fill-hover)',
              disabled: 'var(--color-button-outline-fill-disabled)',
            },
            stroke: {
              default: 'var(--color-button-outline-stroke-default)',
            },
            text: {
              default: 'var(--color-button-outline-text-default)',
              disabled: 'var(--color-button-outline-text-disabled)',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    function ({ addUtilities }) {
      addUtilities({
        '.text-base-semibold': {
          fontSize: '1rem',
          fontWeight: '600',
        },
        '.text-sm-semibold': {
          fontSize: '0.875rem',
          fontWeight: '600',
        },
        '.text-xs-semibold': {
          fontSize: '0.75rem',
          fontWeight: '600',
        },
      });
    },
  ],
};
