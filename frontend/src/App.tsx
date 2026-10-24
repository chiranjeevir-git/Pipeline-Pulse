import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PipelineRunsPage } from './pages/PipelineRunsPage';
import { PipelinesPage } from './pages/PipelinesPage';
import { RunDetailPage } from './pages/RunDetailPage';

function NotFoundPage() {
  return (
    <section className="page">
      <h1>Page not found</h1>
      <p className="lede">That address is not a pipeline or a run.</p>
    </section>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<PipelinesPage />} />
        <Route path="/pipelines/:id" element={<PipelineRunsPage />} />
        <Route path="/runs/:id" element={<RunDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
