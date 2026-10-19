import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Portfolio from './pages/Portfolio';
import Blog from './pages/Blog';
import WorkWithMe from './pages/WorkWithMe';
import Speaking from './pages/Speaking';
import ProjectSubmitted from './pages/ProjectSubmitted';
import Error from './pages/Error';
import BillingLayout from './billing/BillingLayout';
import Dashboard from './billing/Dashboard';
import InvoiceList from './billing/InvoiceList';
import InvoiceForm from './billing/InvoiceForm';
import InvoiceDetail from './billing/InvoiceDetail';
import ClientsPage from './billing/ClientsPage';
import ReceiptsPage from './billing/ReceiptsPage';
import SettingsPage from './billing/SettingsPage';

const App = () => {
  return (
    <Routes>
      <Route path='/' element={<Home/>} />
      <Route path='/about' element={<About/>} />
      <Route path='/speaking' element={<Speaking/>} />
      <Route path='/portfolio' element={<Portfolio/>} />
      <Route path='/blog' element={<Blog/>} />
      <Route path='/work-with-me' element={<WorkWithMe/>} />
      <Route path='/project-submitted' element={<ProjectSubmitted/>} />
      <Route path='/billing' element={<BillingLayout/>}>
        <Route index element={<Dashboard/>} />
        <Route path='invoices' element={<InvoiceList/>} />
        <Route path='invoices/new' element={<InvoiceForm/>} />
        <Route path='invoices/:id' element={<InvoiceDetail/>} />
        <Route path='invoices/:id/edit' element={<InvoiceForm/>} />
        <Route path='clients' element={<ClientsPage/>} />
        <Route path='receipts' element={<ReceiptsPage/>} />
        <Route path='settings' element={<SettingsPage/>} />
      </Route>
      <Route path='*' element={<Error/>}/>
    </Routes>
  )
}

export default App;