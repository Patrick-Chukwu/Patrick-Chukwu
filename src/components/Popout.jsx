import React from 'react'
import { motion } from 'framer-motion'
import { FaMailBulk } from 'react-icons/fa'

const Popout = () => {

  const list = { hidden: {opacity: 90} }
const item = { hidden: { x: -40, opacity: 10, scale: 1.2}}
  return (
    <div>
      <motion.div 
      className=' w-fit bg-black p-2 rounded-full'
      animate={{x: 100, y: 300, rotate: 60}}
      whileHover={{scale: 1.5}}
      // whileTap={{x: -20, scaleX: 2}}
      drag="y"
      dragConstraints={{ top:-100, bottom: 100}}
      ><a href="mailto:chukwupatrickify@gmail.com" target='_blank'><FaMailBulk/></a></motion.div>


      {/* <p>New animation on list</p> */}
      <motion.ul className='flex gap-4 w-fit mx-auto' animate="hidden" variants={list}>
        <motion.li variants={item} className='size-28 bg-white'/>
        <motion.li whileHover={{scale: 0.8, right: 100}} variants={item} className='size-28 bg-black'/>
        <motion.li  className='size-28 bg-silver'/>


      </motion.ul>
    </div>
    
  )
}

export default Popout