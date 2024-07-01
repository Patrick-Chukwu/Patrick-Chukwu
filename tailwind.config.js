export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8f8f90',
        secondary: '#e2e4e8',
        black: '#000',
        white: '#fff',
        silver: "#454545",
        ash: '#564E4E',
        grey: '#232426',
        pic: '#EEEEEE',
        greylight: '#6D6D6D',
        bcolor: '#313336',
        lightash: '#323232',
        lightpowder: '#E9EFFD',
        sidebarcolor: '#000123',
        brand: '#191a1c',
      },
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      backgroundImage: {
        'hero-pattern': "url('/src/assets/pattern.png')",
      },
      keyframes: {
        oscillate: {
          '0%, 100%': { transform: 'translateX(0%)'},
                    '25%': { transform: 'translateX(-3%)'},

          '75%': { transform: 'translateX(5%)'},

          // '100%': { transform: 'translateX(0)'}
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        bounceOnce: {
          '0%, 100%': {
            transform: 'translateY(0)',
        },
        '50%': {
            transform: 'translateY(-10%)',
     
        }
    }
   
      
      },
      animation: {
        oscillate: 'oscillate 5s ease-in-out infinite',
        wiggle: 'wiggle 1s ease-in-out infinite',
        bounceOnce: 'bounceOnce 1s ease-in-out forwards',
      },
    },
  },
  plugins: [],
}

