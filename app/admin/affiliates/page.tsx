'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Users, DollarSign, TrendingUp, Plus, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Affiliate {
  id: number;
  userId: number | null;
  code: string;
  name: string;
  email: string;
  commissionRate: number;
  isActive: boolean;
  totalEarned: number;
  totalPaid: number;
  salesCount: number;
  commissionDue: number;
  createdAt: string;
}

interface Sale {
  id: number;
  amount: number;
  commissionAmount: number;
  plan: string;
  status: string;
  paypalOrderId: string;
  createdAt: string;
  affiliateCode: string;
  affiliateName: string;
  buyerEmail: string;
  buyerName: string;
}

export default function AdminAffiliatesPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'affiliates' | 'sales'>('affiliates');

  // Formulaire de création
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    email: '',
    userId: '',
    commissionRate: '50',
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const headers = {
    'Content-Type': 'application/json',
    'x-admin-password': password,
  };

  const login = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/affiliates', { headers });
      if (res.ok) {
        setAuthenticated(true);
        const data = await res.json();
        setAffiliates(data.affiliates);
        loadSales();
      } else {
        alert('Mot de passe incorrect');
      }
    } catch {
      alert('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const loadAffiliates = async () => {
    const res = await fetch('/api/affiliates', { headers });
    if (res.ok) {
      const data = await res.json();
      setAffiliates(data.affiliates);
    }
  };

  const loadSales = async () => {
    const res = await fetch('/api/affiliates/sales', { headers });
    if (res.ok) {
      const data = await res.json();
      setSales(data.sales);
    }
  };

  const createAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const res = await fetch('/api/affiliates/create', {
      method: 'POST',
      headers,
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (data.success) {
      setFormSuccess(`Affilié "${formData.code}" créé avec succès`);
      setFormData({ code: '', name: '', email: '', userId: '', commissionRate: '50' });
      setShowForm(false);
      loadAffiliates();
    } else {
      setFormError(data.error || 'Erreur lors de la création');
    }
  };

  const markPaid = async (affiliateId: number) => {
    if (!confirm('Marquer toutes les commissions dues comme payées ?')) return;

    const res = await fetch('/api/affiliates/mark-paid', {
      method: 'POST',
      headers,
      body: JSON.stringify({ affiliateId }),
    });

    const data = await res.json();
    if (data.success) {
      loadAffiliates();
    } else {
      alert(data.error || 'Erreur');
    }
  };

  const formatCents = (cents: number) => (cents / 100).toFixed(2) + ' \u20ac';

  // Stats globales
  const totalRevenue = affiliates.reduce((sum, a) => sum + a.totalEarned, 0);
  const totalDue = affiliates.reduce((sum, a) => sum + a.commissionDue, 0);
  const totalSales = affiliates.reduce((sum, a) => sum + a.salesCount, 0);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-white text-center mb-6">Admin Affiliations</h1>
          <input
            type="password"
            placeholder="Mot de passe admin"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            className="w-full bg-[#252525] text-white border border-[#2A2A2A] rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-[#3BB9FF]"
          />
          <button
            onClick={login}
            disabled={loading}
            className="w-full bg-[#3BB9FF] text-white py-3 rounded-xl font-semibold hover:bg-[#2FA9F2] disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Connexion'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#3BB9FF] hover:text-[#2FA9F2] mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8">Dashboard Affiliations</h1>

        {/* Stats globales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-[#3BB9FF]" />
              <span className="text-[#A3A3A3] text-sm">Ventes via affiliés</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalSales}</p>
          </div>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-[#A3A3A3] text-sm">Commissions totales</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCents(totalRevenue)}</p>
          </div>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-orange-400" />
              <span className="text-[#A3A3A3] text-sm">Commissions dues</span>
            </div>
            <p className="text-2xl font-bold text-orange-400">{formatCents(totalDue)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('affiliates')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'affiliates'
                ? 'bg-[#3BB9FF] text-white'
                : 'bg-[#1A1A1A] text-[#A3A3A3] hover:text-white'
            }`}
          >
            Affiliés ({affiliates.length})
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'sales'
                ? 'bg-[#3BB9FF] text-white'
                : 'bg-[#1A1A1A] text-[#A3A3A3] hover:text-white'
            }`}
          >
            Ventes ({sales.length})
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="ml-auto px-4 py-2 rounded-lg font-medium text-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvel affilié
          </button>
        </div>

        {/* Messages */}
        {formSuccess && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-xl px-4 py-3 mb-4 text-green-300 text-sm">
            {formSuccess}
          </div>
        )}
        {formError && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl px-4 py-3 mb-4 text-red-300 text-sm">
            {formError}
          </div>
        )}

        {/* Formulaire création */}
        {showForm && (
          <form onSubmit={createAffiliate} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Créer un affilié</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Code (ex: EMMA50)"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                className="bg-[#252525] text-white border border-[#2A2A2A] rounded-lg px-4 py-2 focus:outline-none focus:border-[#3BB9FF]"
              />
              <input
                placeholder="Nom"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-[#252525] text-white border border-[#2A2A2A] rounded-lg px-4 py-2 focus:outline-none focus:border-[#3BB9FF]"
              />
              <input
                type="email"
                placeholder="Email PayPal"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-[#252525] text-white border border-[#2A2A2A] rounded-lg px-4 py-2 focus:outline-none focus:border-[#3BB9FF]"
              />
              <input
                type="number"
                placeholder="User ID (optionnel)"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="bg-[#252525] text-white border border-[#2A2A2A] rounded-lg px-4 py-2 focus:outline-none focus:border-[#3BB9FF]"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Commission %"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                  className="bg-[#252525] text-white border border-[#2A2A2A] rounded-lg px-4 py-2 w-32 focus:outline-none focus:border-[#3BB9FF]"
                />
                <span className="text-[#A3A3A3] text-sm">% de commission</span>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700"
              >
                Créer
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-[#A3A3A3] hover:text-white px-4 py-2"
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        {/* Table affiliés */}
        {activeTab === 'affiliates' && (
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2A2A2A]">
                    <th className="text-left text-[#A3A3A3] font-medium px-4 py-3">Code</th>
                    <th className="text-left text-[#A3A3A3] font-medium px-4 py-3">Nom</th>
                    <th className="text-left text-[#A3A3A3] font-medium px-4 py-3">Email</th>
                    <th className="text-center text-[#A3A3A3] font-medium px-4 py-3">Taux</th>
                    <th className="text-center text-[#A3A3A3] font-medium px-4 py-3">Ventes</th>
                    <th className="text-right text-[#A3A3A3] font-medium px-4 py-3">Gagné</th>
                    <th className="text-right text-[#A3A3A3] font-medium px-4 py-3">Payé</th>
                    <th className="text-right text-[#A3A3A3] font-medium px-4 py-3">Dû</th>
                    <th className="text-center text-[#A3A3A3] font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliates.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center text-[#A3A3A3] py-8">
                        Aucun affilié pour le moment
                      </td>
                    </tr>
                  ) : (
                    affiliates.map((aff) => (
                      <tr key={aff.id} className="border-b border-[#2A2A2A] hover:bg-[#252525]">
                        <td className="px-4 py-3">
                          <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs font-mono">
                            {aff.code}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white">{aff.name}</td>
                        <td className="px-4 py-3 text-[#A3A3A3]">{aff.email}</td>
                        <td className="px-4 py-3 text-center text-white">{aff.commissionRate}%</td>
                        <td className="px-4 py-3 text-center text-white">{aff.salesCount}</td>
                        <td className="px-4 py-3 text-right text-green-400">{formatCents(aff.totalEarned)}</td>
                        <td className="px-4 py-3 text-right text-[#A3A3A3]">{formatCents(aff.totalPaid)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-orange-400">
                          {formatCents(aff.commissionDue)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {aff.commissionDue > 0 && (
                            <button
                              onClick={() => markPaid(aff.id)}
                              className="inline-flex items-center gap-1 bg-green-600/20 text-green-400 px-3 py-1 rounded-lg text-xs hover:bg-green-600/30"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Payé
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Table ventes */}
        {activeTab === 'sales' && (
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2A2A2A]">
                    <th className="text-left text-[#A3A3A3] font-medium px-4 py-3">Date</th>
                    <th className="text-left text-[#A3A3A3] font-medium px-4 py-3">Acheteur</th>
                    <th className="text-left text-[#A3A3A3] font-medium px-4 py-3">Affilié</th>
                    <th className="text-center text-[#A3A3A3] font-medium px-4 py-3">Plan</th>
                    <th className="text-right text-[#A3A3A3] font-medium px-4 py-3">Montant</th>
                    <th className="text-right text-[#A3A3A3] font-medium px-4 py-3">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-[#A3A3A3] py-8">
                        Aucune vente affiliée pour le moment
                      </td>
                    </tr>
                  ) : (
                    sales.map((sale) => (
                      <tr key={sale.id} className="border-b border-[#2A2A2A] hover:bg-[#252525]">
                        <td className="px-4 py-3 text-[#A3A3A3]">
                          {new Date(sale.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 text-white">
                          {sale.buyerName || sale.buyerEmail}
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs font-mono">
                            {sale.affiliateCode}
                          </span>
                          <span className="text-[#A3A3A3] ml-2">{sale.affiliateName}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-[#3BB9FF]/20 text-[#3BB9FF] px-2 py-1 rounded text-xs">
                            {sale.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-white">{formatCents(sale.amount)}</td>
                        <td className="px-4 py-3 text-right text-green-400 font-semibold">
                          {formatCents(sale.commissionAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
