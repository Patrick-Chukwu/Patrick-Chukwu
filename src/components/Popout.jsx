import React from 'react'
import { motion } from 'framer-motion'
import { FaMailBulk, FaWhatsapp } from 'react-icons/fa'

const Popout = () => {

//   const list = { hidden: {opacity: 90} }
// const item = { hidden: { x: -40, opacity: 10, scale: 1.2}}
  return (
    <div>
      <motion.div 
      className=' w-fit text-black bg-white p-2 rounded-full fixed z-50 right-4 bottom-4'
      
      whileHover={{scale: 1.5}}
      // whileTap={{x: -20, scaleX: 2}}
      drag="y"
      dragConstraints={{ top:-500, bottom: 10}}
      >
        <a href="https://wa.me/message/4GGBPY2AUFEMB1"><FaWhatsapp/></a>
      </motion.div>


      {/* <p>New animation on list</p> */}
      {/* <motion.ul className='flex gap-4 w-fit mx-auto' animate="hidden" variants={list}>
        <motion.li variants={item} className='size-28 bg-white'/>
        <motion.li whileHover={{scale: 0.8, right: 100}} variants={item} className='size-28 bg-black'/>
        <motion.li  className='size-28 bg-silver'/>


      </motion.ul> */}
    </div>
    
  )
}

export default Popout