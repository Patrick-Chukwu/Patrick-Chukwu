import React from 'react'
import Navbar from '../components/Navbar'
import frontend from '../assets/stocks/FRONTEND-TECHNOLOGIES.jpg'
import blockchain from '../assets/stocks/blockchain.webp'
import ikere from '../assets/stocks/ikeretech.webp'


const Blog = () => {
  return (
    <div className='mt-24'>
      <Navbar/>
      <h3 className="text-xl font-medium text-center w-[98%] max-w-[710px] mx-auto">When I am not too engrossed on projects, I create contents around the three sectors I currently find interest, viz: tech, education and social impact.</h3>
      <div className="flex flex-col md:flex-row gap-4 justify-center items-center p-4 ">
              {/* first */}

        <a href="https://medium.com/@chukwupatrickify/a-birds-eye-view-at-different-front-end-technologies-415f0d02630c" target='_blank'>
        <div className="w-[360px] flex flex-col gap-2 justify-start items-center p-2 border h-[450px] border-bcolor rounded-md shadow  bg-black">
        <img src={frontend} alt="" className='w-[350px]' />
          <h2 className="text-lg md:text-xl px-2 py-2 text-left rounded-md font-semibold">A bird's eye-view of different frontend technologies</h2>
<p className="text-sm font-normal text-secondary px-0 text-left">The front-end development space has greatly evolved over the years. Thanks to this innovation, the option of which technology to leverage for building visually appealing user interfaces that will offer great user experiences abound. <br/>
<span className="text-sm font-thin border-b text-center w-fit mx-auto block">click to read more</span></p>

        </div>
        </a>
        {/* second */}
        <a href="https://medium.com/@pattyfean/understanding-blockchain-and-its-advantages-81dd7d529ebe" target='_blank'>
        <div className="h-[450px] w-[360px] flex flex-col gap-2 justify-start items-center p-2 border border-bcolor rounded-md shadow  bg-black">
        <img src={blockchain} alt="" className='w-[350px]' />
          <h2 className="text-lg md:text-xl px-2 py-2 text-left rounded-md font-semibold">Understanding Blockchain and its advantages</h2>
<p className="text-sm font-normal text-secondary px-0 text-left">The blockchain is like an online registry where the data about a transaction is stored. The blockchain consists of blocks, which are linked together in a linear fashion.
  <br/>
<span className="text-sm font-thin border-b text-center w-fit mx-auto block">click to read more</span></p>

        </div>
        </a>
        {/* third */}
        <a href="https://speakerdeck.com/thepatrickchukwu/a-beginners-guide-to-understanding-blockchain-technology" target='_blank'>
        <div className="h-[450px] w-[360px] flex flex-col gap-2 justify-start items-center p-2 border border-bcolor rounded-md shadow  bg-black">
        <img src={ikere} alt="Slides cover page" className='w-[350px]' />
          <h2 className="text-lg md:text-xl px-2 py-2 text-left rounded-md font-semibold">A Beginner's Guide to Understanding Blockchain Technology</h2>
<p className="text-sm font-normal text-secondary px-0 text-left">This presentation provided a clear introduction to blockchain, covering its basic concepts, unique features, real-world applications, and future prospects.
<br/>
<span className="text-sm font-thin border-b text-center w-fit mx-auto block">click to read more</span>
</p>

        </div>
        </a>
      </div>
      </div>
  )
}

export default Blog