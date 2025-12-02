import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import ExpenseForm from '../components/ExpenseForm';

export default function TripDetailPage() {
  const { id } = useParams();
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loadingExpense, setLoadingExpense] = useState(false);
  const navigate = useNavigate();

  const trip = useMemo(() => trips.find((t) => String(t.id) === String(id)), [trips, id]);

  const fetchTrips = async () => {
    const { data } = await api.get('/trips');
    setTrips(data);
  };

  const fetchExpenses = async () => {
    try {
      const { data } = await api.get(`/trips/${id}/expenses`);
      setExpenses(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar despesas');
    }
  };

  useEffect(() => {
    fetchTrips();
    fetchExpenses();
  }, [id]);

  const handleCreateExpense = async (payload) => {
    setLoadingExpense(true);
    setMessage('');
    setError('');
    try {
      const { attachment, ...body } = payload; // placeholder para quando o backend suportar upload
      await api.post(`/trips/${id}/expenses`, body);
      setMessage('Despesa registrada com sucesso');
      fetchExpenses();
      fetchTrips();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar despesa');
    } finally {
      setLoadingExpense(false);
    }
  };

  const handleSubmitTrip = async () => {
    setMessage('');
    setError('');
    try {
      await api.post(`/trips/${id}/submit`);
      setMessage('Relatório enviado para aprovação');
      fetchTrips();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao enviar para aprovação');
    }
  };

  if (!trip) {
    return (
      <div className="card">
        <p>Carregando viagem...</p>
        <Link to="/" className="link">
          Voltar
        </Link>
      </div>
    );
  }

  const isEditable = trip.status === 'DRAFT' || trip.status === 'REJECTED';

  return (
    <div className="stack">
      <section className="card">
        <header className="header-row">
          <div>
            <p className="muted">{trip.destination}</p>
            <h2>{trip.purpose}</h2>
            <p className="muted">Status: {trip.status}</p>
          </div>
          <div className="actions">
            <button className="secondary" onClick={() => navigate(-1)}>
              Voltar
            </button>
            <button className="primary" onClick={handleSubmitTrip} disabled={!isEditable}>
              Enviar para aprovação
            </button>
          </div>
        </header>
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      <section className="card">
        <h3>Despesas</h3>
        <div className="stack">
          {expenses.map((exp) => (
            <article key={exp.id} className="pill">
              <div>
                <p className="muted">{exp.spent_at}</p>
                <p>{exp.description || 'Despesa'}</p>
                <p className="muted">Valor: R$ {Number(exp.amount_effective).toFixed(2)}</p>
                {exp.km_quantity && (
                  <p className="muted">
                    KM: {exp.km_quantity} • Rate: R$ {exp.km_rate_applied} • Capped: {exp.km_capped ? 'Sim' : 'Não'}
                  </p>
                )}
              </div>
            </article>
          ))}
          {expenses.length === 0 && <p className="muted">Nenhuma despesa cadastrada.</p>}
        </div>
      </section>

      {isEditable ? (
        <ExpenseForm onSubmit={handleCreateExpense} loading={loadingExpense} />
      ) : (
        <p className="muted">Relatório não está editável.</p>
      )}
    </div>
  );
}
