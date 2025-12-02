import { useEffect, useState } from 'react';
import api from '../api/client';

export default function ApprovalsPage() {
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');

  const fetchTrips = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/approvals');
      setTrips(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar fila de aprovação');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const approve = async (id) => {
    await api.post(`/approvals/${id}/approve`);
    fetchTrips();
  };

  const reject = async (id) => {
    await api.post(`/approvals/${id}/reject`, { comment });
    setComment('');
    fetchTrips();
  };

  return (
    <div className="stack">
      <section className="card">
        <h2>Fila de aprovação</h2>
        {error && <p className="error">{error}</p>}
        {loading && <p className="muted">Carregando...</p>}
        <div className="stack">
          {trips.map((trip) => (
            <article key={trip.id} className="pill">
              <div>
                <p className="muted">{trip.destination}</p>
                <p>{trip.purpose}</p>
                <p className="muted">Solicitante: {trip.user_name}</p>
                <p className="muted">Projeto: {trip.cost_center_name}</p>
              </div>
              <div className="actions">
                <button className="secondary" onClick={() => approve(trip.id)}>
                  Aprovar
                </button>
                <button className="danger" onClick={() => reject(trip.id)}>
                  Reprovar
                </button>
              </div>
            </article>
          ))}
          {trips.length === 0 && !loading && <p className="muted">Nenhum relatório em aprovação.</p>}
        </div>
      </section>
      <section className="card">
        <h3>Justificativa de reprovação</h3>
        <p className="muted">Preencha antes de reprovar uma viagem.</p>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Motivo da reprovação" />
      </section>
    </div>
  );
}
