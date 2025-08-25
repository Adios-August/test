import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/home/Home';
import NotFound from '../pages/common/NotFound';
import Developing from '../components/Developing';
import Knowledge from '../pages/knowledge/Knowledge';
import KnowledgeDetail from '../pages/knowledge/KnowledgeDetail';
import KnowledgeDetailPage from '../pages/knowledge-detail/KnowledgeDetailPage';
import KnowledgeQA from '../pages/knowledge/KnowledgeQA';
import KnowledgeManagement from '../pages/knowledge-management/KnowledgeManagement';
import RoleManagement from '../pages/knowledge-management/RoleManagement';
import CategoryManagement from '../pages/knowledge-management/CategoryManagement';
import { AddKnowledge } from '../pages/knowledge-management';
import QueriesManagement from '../pages/knowledge-management/QueriesManagement';
import FeedbackManagement from '../pages/knowledge-management/FeedbackManagement';
import Favorites from '../pages/favorites/Favorites';
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
            path: '/knowledge-detail/:id',
            element: <KnowledgeDetailPage />,
          },
          {
            path: '/knowledge-qa',
            element: <KnowledgeQA />,
          },
          {
            path: '/add-knowledge',
            element: <AddKnowledge />,
          },
          {
            path: '/favorites',
            element: <Favorites />,
          },
           
          {
            path: '/knowledge-admin',
            element: <KnowledgeManagement />,
            children: [
              {
                path: '',
                element: <RoleManagement />,
              },
              {
                path: 'role-management',
                element: <RoleManagement />,
              },
              {
                path: 'category-management',
                element: <CategoryManagement />,
              },
              {
                path: 'queries',
                element: <QueriesManagement />,
              },
              {
                path: 'feedback',
                element: <FeedbackManagement />,
              },
            ],
          },
          // {
          //   path: '/stats',
          //   element: <Developing title="数据统计功能开发中" />,
          // },
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