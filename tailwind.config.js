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
                    200: '#000000', // true black
                    300: '#0A0A0A',
                    400: '#1A1A1A',
                },
                green: {
                    500: '#24AE7C', // main accent
                    600: '#0D2A1F', // dark accent
                    700: '#28C76F', // hover accent
                },
                blue: {
                    500: '#79B5EC',
                    600: '#152432'
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
                    200: '#0D0F10',
                    300: '#131619', // sidebar default bg
                    400: '#1A1D21', // sidebar hover bg
                    500: '#363A3D', // sidebar active / selected
                    600: '#76828D',
                    700: '#ABB8C4',
                    800: '#17191D'
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


