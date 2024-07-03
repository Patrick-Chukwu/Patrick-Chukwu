import { motion } from 'framer-motion'
import React from 'react'

const Footer = () => {
  return (
    <div className='flex flex-col items-center py-4 justify-start gap-8 min-h-32 border-t border-bcolor w-full'>
        <motion.h2 initial={{scale:1, opacity:0}} whileInView={{scale: 1.5, opacity:1}} whileHover={{ left:10}} className='py-4 text-xl md:text-3xl font-bold w-fit mx-auto focus:text-white hover:text-white'> Let's work together</motion.h2>
        
    </div>
  )
}

export default Footer