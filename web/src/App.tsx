import type { ComponentType } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import SiteLayout from './components/SiteLayout';
import Home from './pages/Home';
import Templates from './pages/Templates';
import TemplateDetail from './pages/TemplateDetail';
import MyDiaries from './pages/MyDiaries';
import Cart from './pages/Cart';
import OrderPlaced from './pages/OrderPlaced';
import NotFound from './pages/NotFound';
import CreateLayout from './pages/create/CreateLayout';
import Upload from './pages/create/Upload';
import RouteError from './pages/RouteError';

const lazyPage = (load: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await load()).default });

const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Home /> },
      { path: 'templates', element: <Templates /> },
      { path: 'templates/:slug', element: <TemplateDetail /> },
      { path: 'diaries', element: <MyDiaries /> },
      { path: 'cart', element: <Cart /> },
      { path: 'checkout', lazy: lazyPage(() => import('./pages/Checkout')) },
      { path: 'order/:orderId', element: <OrderPlaced /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    // Staff only: a separate lazy bundle, never linked from the storefront.
    path: 'admin/*',
    lazy: lazyPage(() => import('./admin/AdminApp')),
    errorElement: <RouteError />,
  },
  {
    path: 'create/:projectId',
    element: <CreateLayout />,
    errorElement: <RouteError />,
    children: [
      { path: 'photos', element: <Upload /> },
      { path: 'design', lazy: lazyPage(() => import('./pages/create/Design')) },
      { path: 'preview', lazy: lazyPage(() => import('./pages/create/Preview')) },
      { path: 'order', lazy: lazyPage(() => import('./pages/create/OrderOptions')) },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
