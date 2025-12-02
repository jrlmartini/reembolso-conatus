import { useState } from 'react';

export default function ExpenseForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    spent_at: new Date().toISOString().slice(0, 10),
    expense_category_id: '',
    payment_method_id: '',
    cost_center_id: '',
    description: '',
    amount: '',
    km_quantity: '',
    attachment: null
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setForm((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      amount: Number(form.amount),
      expense_category_id: Number(form.expense_category_id),
      payment_method_id: form.payment_method_id ? Number(form.payment_method_id) : undefined,
      cost_center_id: form.cost_center_id ? Number(form.cost_center_id) : undefined,
      km_quantity: form.km_quantity ? Number(form.km_quantity) : undefined,
      attachment: form.attachment
    };
    onSubmit(payload);
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h3>Nova despesa</h3>
      <label>
        Foto / comprovante
        <input type="file" name="attachment" accept="image/*" onChange={handleChange} />
      </label>
      <label>
        Categoria (ID)
        <input name="expense_category_id" value={form.expense_category_id} onChange={handleChange} required />
      </label>
      <label>
        Projeto / Centro de Custo (ID)
        <input name="cost_center_id" value={form.cost_center_id} onChange={handleChange} placeholder="opcional" />
      </label>
      <label>
        Forma de pagamento (ID)
        <input name="payment_method_id" value={form.payment_method_id} onChange={handleChange} placeholder="opcional" />
      </label>
      <label>
        Valor (R$)
        <input type="number" step="0.01" name="amount" value={form.amount} onChange={handleChange} required />
      </label>
      <label>
        Data da despesa
        <input type="date" name="spent_at" value={form.spent_at} onChange={handleChange} required />
      </label>
      <label>
        Quilometragem (km) — somente para categoria de km
        <input type="number" step="0.01" name="km_quantity" value={form.km_quantity} onChange={handleChange} />
      </label>
      <label>
        Observações
        <textarea name="description" value={form.description} onChange={handleChange} />
      </label>
      <button type="submit" className="primary" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar despesa'}
      </button>
    </form>
  );
}
