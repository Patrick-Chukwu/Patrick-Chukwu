import React, { useState, useEffect } from 'react';
import './ImageSlider.css';
import project1 from '../assets/Projectts/project1.webp'
import project2 from '../assets/Projectts/project2.webp'
import project3 from '../assets/Projectts/project3.webp'
import project4 from '../assets/Projectts/project4.webp'
import project5 from '../assets/Projectts/timbucloud.webp'

const images = [
  project1,
  project2,
  project3,
  project4,
  project5
];

const ImageSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-[80%]  mx-auto h-full overflow-hidden my-4 p-4 opacity-40 hover:opacity-90  focus:opacity-90">
      {images.map((image, index) => (
        <img
          key={index}
          src={image}
          alt={`Project ${index}`}
          className={`absolute top-0 left-0 w-full h-full object-contain transition-transform duration-1000 ease-in-out ${index === currentIndex ? 'transform translate-x-0 opacity-90' : 'transform -translate-x-90 opacity-10'}`}
          style={{ left: `${index * 5}%`, right: `${(index + 1) * 20}`, zIndex: index === currentIndex ? 10 : 0 }}
        />
      ))}
    </div>
  );
};

export default ImageSlider;
