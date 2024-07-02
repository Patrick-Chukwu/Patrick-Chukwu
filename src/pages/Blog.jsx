import React from 'react'
import Navbar from '../components/Navbar'
import frontend from '../assets/stocks/FRONTEND-TECHNOLOGIES.jpg'

const Blog = () => {
  return (
    <div className='mt-24'>
      <Navbar/>
      <div className="flex gap-4 justify-center items-center p-4">
        <div className="w-[360px] flex flex-col gap-2 justify-center items-center p-2 border border-bcolor shadow">
          <h2 className="text-lg md:text-xl px-4 py-2 text-center rounded-md font-semibold bg-black">A bird's eye-view of different frontend technologies</h2>
          <img src={frontend} alt="" className='w-[350px]' />


        </div>
      </div>
      </div>
  )
}

export default Blog