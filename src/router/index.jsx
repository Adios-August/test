import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/home/Home';
import NotFound from '../pages/common/NotFound';
import Developing from '../components/Developing';
import Knowledge from '../pages/knowledge/Knowledge';
import KnowledgeDetail from '../pages/knowledge/KnowledgeDetail';
import KnowledgeQA from '../pages/knowledge/KnowledgeQA';
import Login from '../pages/login/Login';
import RouteGuard from './RouteGuard';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <RouteGuard />,
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          {
            path: '/',
            element: <Home />,
          },
          {
            path: '/knowledge',
            element: <Knowledge />,
          },
          {
            path: '/knowledge/:id',
            element: <KnowledgeDetail />,
          },
          {
            path: '/knowledge-qa',
            element: <KnowledgeQA />,
          },
           
          {
            path: '/knowledge-admin',
            element: <Developing title="知识库管理功能开发中" />,
          },
          {
            path: '/stats',
            element: <Developing title="数据统计功能开发中" />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default router; 