import React from 'react'
import Navbar from '../components/Navbar'
import frontend from '../assets/stocks/FRONTEND-TECHNOLOGIES.jpg'

const Blog = () => {
  return (
    <div className='mt-24'>
      <Navbar/>
      <h3 className="text-xl font-medium text-center">When I am not too engrossed on projects, I create contents around the three sectors I currently find interest, viz: tech, education and social impact.</h3>
      <div className="flex gap-4 justify-center items-center p-4 ">
        <a href="https://medium.com/@chukwupatrickify/a-birds-eye-view-at-different-front-end-technologies-415f0d02630c" target='_blank'>
        <div className="w-[360px] flex flex-col gap-2 justify-center items-center p-2 border border-bcolor rounded-md shadow">
          <h2 className="text-lg md:text-xl px-4 py-2 text-center rounded-md font-semibold bg-black">A bird's eye-view of different frontend technologies</h2>
          <img src={frontend} alt="" className='w-[350px]' />
<p className="text-sm font-normal text-secondary px-0 text-left">The front-end development space has greatly evolved over the years. There are more technologies available today than there ever was. Thanks to this innovation, the option of which technology to leverage for building visually appealing user interfaces that will offer great user experiences abound.</p>

        </div>
        </a>
      </div>
      </div>
  )
}

export default Blog