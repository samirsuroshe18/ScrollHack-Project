import { useState } from 'react'
import './App.css'
import LandingPage from './components/Landingpage'


function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <LandingPage/>
    </div>
  )
}

export default App
