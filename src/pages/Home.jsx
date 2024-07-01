import React from 'react'
import Navbar from '../components/Navbar'

const Home = () => {
  return (
    <div className='flex flex-col mt-20'>
        <Navbar/>
        <section className="pl-4 h-dvh flex flex-col items-left justify-start">
          <h2 className='text-primary text-2xl'>Meet Patrick Chukwu</h2>
          <p className="text-secondary font-semibold text-3xl">Front-end Developer</p>
          <p className='text-primary text-2xl'>Building amazing stuff.</p>


        </section>
    </div>
  )
}

export default Home