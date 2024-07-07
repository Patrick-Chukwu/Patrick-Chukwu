import { motion } from 'framer-motion'
import React from 'react'

const Footer = () => {
  return (
    <div className='flex flex-col items-center py-4 justify-start gap-8 min-h-32 border-t border-bcolor w-full'>
        <motion.h2 initial={{scale:1, opacity:0}} whileInView={{scale: 1.5, opacity:1}} whileHover={{ left:10}} className='py-4 text-xl md:text-3xl font-bold w-fit mx-auto focus:text-white hover:text-white'> Let's work together</motion.h2>
        <div className="flex justify-between items-center gap-2">
        <a href='https://calendar.app.google/zYzRKYgvBGGoMdw18' target='_blank'
 className='bg-primary text-black py-2 px-4 w-fit font-medium hover:text-white rounded-md lg:rounded-lg md:rounded-md xl:rounded-xl '>Book a call</a>
    <a href="mailto:chukwupatrickify@gmail.com" target='_blank' className=' py-2 px-4 w-fit font-medium text-white rounded-md lg:rounded-lg md:rounded-md xl:rounded-xl'>📩 chukwupatrickify@gmail.com</a>
        </div>
    </div>
  )
}

export default Footer