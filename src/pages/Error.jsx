import React from 'react'
import Navbar from '../components/Navbar'

const Error = () => {
  return (
    <div className=' h-vh '>
        <Navbar/>
        <div className='flex flex-col items-center justify-center h-[80vh]'> 
        <h2 className='text-3xl font-bold text-primary'>Sorry, page not found!</h2>
        </div>
        </div>
  )
}

export default Error