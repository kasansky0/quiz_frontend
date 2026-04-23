/** @type {import('tailwindcss').Config} */
const { fontFamily } = require("tailwindcss/defaultTheme");
const tailwindcssAnimate = require("tailwindcss-animate");

module.exports = {
    darkMode: ["class"],
    content: [
        "./components/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./app/**/*.{ts,tsx}",
        "./src/**/*.{ts,tsx}",
    ],
    prefix: "",
    theme: {
    	container: {
    		center: true,
    		padding: '2rem',
    		screens: {
    			'2xl': '1400px'
    		}
    	},
    	extend: {
            colors: {
                "dark-main": "#0f0f0f",      // main window
                "dark-sidebar": "#111111",   // sidebar slightly different
                black: {
                    DEFAULT: '#000000',

                    // Premium app background (slightly darker, more depth)
                    200: "#f5f5f4", // warm-neutral (very common modern UI)

                    // Surface / secondary background
                    300: '#DADFE6',

                    // Cards / borders contrast
                    400: '#FFFFFF',
                },
                neutral: {
                    50: "#fafafa",
                    100: "#f5f5f5",
                    200: "#e5e5e5",
                    300: "#d4d4d4",
                    400: "#a3a3a3",
                    500: "#737373",
                    600: "#525252", // <-- text-neutral-600
                    700: "#404040",
                    800: "#262626",
                    900: "#171717",
                },
                green: {
                    500: '#24AE7C', // main accent
                    600: '#16A34A', // hover (darker)
                    700: '#15803D', // active / deeper
                },
                blue: {
                    400: "#0A66C2",
                    500: '#2563EB', // darker primary
                    600: '#1D4ED8', // hover
                },
                red: {
                    500: '#F37877',
                    600: '#3E1716',
                    700: '#F24E43'
                },
                light: {
                    100: '#F5F5F5', // main content background
                    200: '#E8E9E9', // cards / panels
                    300: '#D1D5DB', // subtle borders / separators
                },
                dark: {
                    100: '#FFFFFF',  // pure background / pages
                    200: '#F8FAFC',  // main surfaces
                    300: '#F1F5F9',  // cards / panels
                    400: '#E2E8F0',  // hover surfaces
                    500: '#CBD5E1',  // borders / dividers
                    600: '#94A3B8',  // muted text
                    700: '#64748B',  // secondary text
                    800: '#334155',  // strong text
                    900: '#0F172A',  // deepest contrast text
                },
                sidebar: {
                    DEFAULT: '#131619', // matches dark-300
                    hover: '#1A1D21',   // slightly lighter for hover
                    active: '#363A3D',  // highlight selected menu item
                },
                sidebarButton: {
                    DEFAULT: '#24AE7C',
                    hover: '#28C76F',
                    active: '#0D2A1F',
                },
                overlay: {
                    DEFAULT: 'rgba(0,0,0,0.6)',
                    light: 'rgba(0,0,0,0.3)',
                },
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: '#E8E9E9', // use light-200 for cards
                    foreground: '#0D0F10', // dark text
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: '#D1D5DB', // light-300
                input: '#E8E9E9',  // light-200
                ring: '#24AE7C',   // green accent
                chart: {
                    1: 'hsl(var(--chart-1))',
                    2: 'hsl(var(--chart-2))',
                    3: 'hsl(var(--chart-3))',
                    4: 'hsl(var(--chart-4))',
                    5: 'hsl(var(--chart-5))'
                }
            },
    		fontFamily: {
    			sans: [
    				'var(--font-sans)',
                    ...fontFamily.sans
                ]
    		},
    		backgroundImage: {
    			appointments: "url('/assets/images/appointments-bg.png')",
    			pending: "url('/assets/images/pending-bg.png')",
    			cancelled: "url('/assets/images/cancelled-bg.png')"
    		},

            keyframes: {
                loadingDots: {
                    '0%, 80%, 100%': { transform: 'scale(0)', opacity: '0.3' },
                    '40%': { transform: 'scale(1)', opacity: '1' },
                },
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' }
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' }
                },
                'caret-blink': {
                    '0%,70%,100%': { opacity: '1' },
                    '20%,50%': { opacity: '0' }
                },
                // <-- Paste loading keyframe here
                loading: {
                    '0%': { transform: 'translateX(-100%)' },
                    '50%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(-100%)' }
                }
            },
            animation: {
                'dot-bounce': 'loadingDots 1.4s infinite ease-in-out both',
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'caret-blink': 'caret-blink 1.25s ease-out infinite',
                // <-- Add loading animation here
                'loading': 'loading 1.5s infinite ease-in-out'
            },
            borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		}
    	}
    },
    plugins: [
        tailwindcssAnimate,
        require("tailwindcss-animate"),
        require('@tailwindcss/line-clamp'), // <-- add this
    ],
};


