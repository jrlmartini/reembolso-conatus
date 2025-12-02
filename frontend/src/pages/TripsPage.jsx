import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [form, setForm] = useState({ destination: '', purpose: '', start_date: '', end_date: '', cost_center_id: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTrips = async () => {
    try {
      const { data } = await api.get('/trips');
      setTrips(data);
    } catch {
      setError('Erro ao carregar viagens');
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/trips', {
        destination: form.destination,
        purpose: form.purpose,
        start_date: form.start_date,
        end_date: form.end_date || null,
        cost_center_id: Number(form.cost_center_id)
      });
      setForm({ destination: '', purpose: '', start_date: '', end_date: '', cost_center_id: '' });
      fetchTrips();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar viagem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack">
      <section className="card">
        <h2>Minhas viagens</h2>
        {error && <p className="error">{error}</p>}
        <div className="grid">
          {trips.map((trip) => (
            <article key={trip.id} className="pill">
              <div>
                <p className="muted">{trip.destination}</p>
                <p>{trip.purpose}</p>
                <p className="muted">Status: {trip.status}</p>
              </div>
              <Link className="link" to={`/trips/${trip.id}`}>
                Abrir
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Nova viagem</h3>
        <form className="form-grid" onSubmit={handleCreate}>
          <label>
            Destino
            <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required />
          </label>
          <label>
            Motivo
            <input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} required />
          </label>
          <label>
            Data início
            <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
          </label>
          <label>
            Data fim (opcional)
            <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </label>
          <label>
            Centro de Custo / Projeto (ID)
            <input
              value={form.cost_center_id}
              onChange={(e) => setForm({ ...form, cost_center_id: e.target.value })}
              required
              inputMode="numeric"
            />
          </label>
          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Criando...' : 'Criar viagem'}
          </button>
        </form>
      </section>
    </div>
  );
}
