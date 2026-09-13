import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Portfolio from './pages/Portfolio';
import Blog from './pages/Blog';
import WorkWithMe from './pages/WorkWithMe';
import Error from './pages/Error';

const App = () => {
  return (
    <Routes>
      <Route path='/' element={<Home/>} />
      <Route path='/about' element={<About/>} />
      <Route path='/portfolio' element={<Portfolio/>} />
      <Route path='/blog' element={<Blog/>} />
      <Route path='/work-with-me' element={<WorkWithMe/>} />
      <Route path='*' element={<Error/>}/>
    </Routes>
  )
}

export default App;