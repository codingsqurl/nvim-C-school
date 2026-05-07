import { createBrowserRouter, redirect } from 'react-router-dom';
import Layout from '@/components/Layout.tsx';
import Curriculum from '@/pages/Curriculum.tsx';
import Exercises from '@/pages/Exercises.tsx';
import Arcade from '@/pages/Arcade.tsx';
import Concepts from '@/pages/Concepts.tsx';
import TerminalPage from '@/pages/TerminalPage.tsx';
import Neovim from '@/pages/Neovim.tsx';
import Embedded from '@/pages/Embedded.tsx';
import NotFound from '@/pages/NotFound.tsx';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', loader: () => redirect('/curriculum') },
      { path: '/curriculum', element: <Curriculum /> },
      { path: '/exercises', element: <Exercises /> },
      { path: '/arcade', element: <Arcade /> },
      { path: '/concepts', element: <Concepts /> },
      { path: '/terminal', element: <TerminalPage /> },
      { path: '/neovim', element: <Neovim /> },
      { path: '/embedded', element: <Embedded /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
