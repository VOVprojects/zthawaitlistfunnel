/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Quiz } from './components/Quiz';
import { Welcome } from './components/Welcome';
import { Footer } from './components/Footer';

// Placeholder components for routes
function Dashboard() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f3ed]">
      <h1 className="text-3xl font-bold text-[#0c1115]">Dashboard (Placeholder)</h1>
    </div>
  );
}

function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f3ed]">
      <h1 className="text-3xl font-bold text-[#0c1115]">Login (Placeholder)</h1>
    </div>
  );
}

function QuizLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3ed]">
      <main className="flex-1 flex flex-col">
        <Quiz />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<QuizLayout />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
