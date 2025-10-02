import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { DollarSign, TrendingUp, Calendar, Filter, Download } from 'lucide-react';

export const Economics: React.FC = () => {
  const { reservations, loading } = useData();
  const [dateFilter, setDateFilter] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');

  const getDateRange = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    switch (timeRange) {
      case 'today':
        return {
          start: today.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      case 'week':
        return {
          start: startOfWeek.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      case 'month':
        return {
          start: startOfMonth.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      case 'custom':
        return dateFilter;
      default:
        return dateFilter;
    }
  };

  const filteredReservations = useMemo(() => {
    const range = getDateRange();
    return reservations.filter(reservation => {
      const reservationDate = new Date(reservation.appointmentDate);
      const startDate = new Date(range.start);
      const endDate = new Date(range.end);
      
      return reservationDate >= startDate && reservationDate <= endDate;
    });
  }, [reservations, timeRange, dateFilter]);

  const economics = useMemo(() => {
    const totalRevenue = filteredReservations.reduce((sum, res) => sum + res.totalPrice, 0);
    const totalDeposits = filteredReservations.reduce((sum, res) => sum + res.depositPaid, 0);
    const depositsPaidCount = filteredReservations.filter(res => res.depositPaidStatus).length;
    const restPaidCount = filteredReservations.filter(res => res.restPaidStatus).length;
    const fullyPaidReservations = filteredReservations.filter(res => res.depositPaidStatus && res.restPaidStatus);
    const totalPaid = fullyPaidReservations.reduce((sum, res) => sum + res.totalPrice, 0);
    const actualDepositsCollected = filteredReservations
      .filter(res => res.depositPaidStatus)
      .reduce((sum, res) => sum + res.depositPaid, 0);
    const pendingRevenue = filteredReservations
      .filter(res => !res.restPaidStatus)
      .reduce((sum, res) => sum + (res.totalPrice - res.depositPaid), 0);

    return {
      totalRevenue,
      totalDeposits,
      actualDepositsCollected,
      totalPaid,
      pendingRevenue,
      totalReservations: filteredReservations.length,
      depositsPaidCount,
      restPaidCount,
      fullyPaidCount: fullyPaidReservations.length,
      pendingReservations: filteredReservations.length - fullyPaidReservations.length,
      averageTicket: filteredReservations.length > 0 ? totalRevenue / filteredReservations.length : 0
    };
  }, [filteredReservations]);

  const handleTimeRangeChange = (range: 'today' | 'week' | 'month' | 'custom') => {
    setTimeRange(range);
    if (range !== 'custom') {
      const newRange = getDateRange();
      setDateFilter(newRange);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Date', 'Client', 'Phone', 'Artist', 'Total Price', 'Deposit', 'Status'],
      ...filteredReservations.map(res => [
        res.appointmentDate,
        `${res.firstName} ${res.lastName}`,
        res.phone,
        res.artistId || 'Not assigned',
        res.totalPrice.toFixed(2),
        res.depositPaid.toFixed(2),
        res.isPaid ? 'Paid' : 'Pending'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `economics-${getDateRange().start}-to-${getDateRange().end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 border border-orange-900 rounded-2xl shadow-lg p-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <p className="text-orange-300 mt-2">Loading economics data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-black border border-red-900 rounded-2xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">Economics Dashboard</h1>
            <p className="text-white">Track your studio's financial performance</p>
          </div>
          <button
            onClick={exportData}
            className="bg-gradient-to-r from-yellow-600 to-amber-700 text-black px-6 py-3 rounded-lg hover:from-yellow-500 hover:to-amber-600 transition-all flex items-center space-x-2 font-semibold"
          >
            <Download size={20} />
            <span>Export Data</span>
          </button>
        </div>

        {/* Time Range Filters */}
        <div className="mb-8 bg-gray-900 border border-red-800 rounded-lg p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              {[
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'This Week' },
                { key: 'month', label: 'This Month' },
                { key: 'custom', label: 'Custom Range' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleTimeRangeChange(key as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    timeRange === key
                      ? 'bg-yellow-600 text-black'
                      : 'bg-gray-600 text-white hover:bg-gray-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {timeRange === 'custom' && (
              <div className="flex gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">From</label>
                  <input
                    type="date"
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                    className="px-3 py-2 bg-black border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">To</label>
                  <input
                    type="date"
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                   className="px-3 py-2 bg-black border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-900 to-green-800 border border-green-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-white">€{economics.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-900 to-blue-800 border border-blue-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Total Paid</p>
                <p className="text-2xl font-bold text-white">€{economics.totalPaid.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-900 to-yellow-800 border border-yellow-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-300 text-sm font-medium">Actual Deposits Collected</p>
                <p className="text-2xl font-bold text-white">€{economics.actualDepositsCollected.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-900 to-orange-800 border border-orange-700 rounded-lg p-6">
         <div className="bg-gradient-to-r from-red-900 to-red-800 border border-red-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
               <p className="text-red-300 text-sm font-medium">Pending Revenue</p>
                <p className="text-2xl font-bold text-white">€{economics.pendingRevenue.toFixed(2)}</p>
              </div>
             <Calendar className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-700 border border-gray-600 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Reservations Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Total Reservations:</span>
                <span className="text-white font-semibold">{economics.totalReservations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Deposits Paid:</span>
                <span className="text-yellow-400 font-semibold">{economics.depositsPaidCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Rest Paid:</span>
                <span className="text-blue-400 font-semibold">{economics.restPaidCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Fully Paid:</span>
                <span className="text-green-400 font-semibold">{economics.fullyPaidCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Pending Reservations:</span>
                <span className="text-yellow-400 font-semibold">{economics.pendingReservations}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-700 border border-gray-600 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Average Ticket:</span>
                <span className="text-white font-semibold">€{economics.averageTicket.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Payment Rate:</span>
                <span className="text-white font-semibold">
                  {economics.totalReservations > 0 
                    ? ((economics.fullyPaidCount / economics.totalReservations) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Deposit Rate:</span>
                <span className="text-white font-semibold">
                  {economics.totalReservations > 0 
                    ? ((economics.depositsPaidCount / economics.totalReservations) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-700 border border-gray-600 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Date Range</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">From:</span>
                <span className="text-white font-semibold">
                  {new Date(getDateRange().start).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">To:</span>
                <span className="text-white font-semibold">
                  {new Date(getDateRange().end).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Period:</span>
                <span className="text-white font-semibold capitalize">{timeRange}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-gray-700 border border-gray-600 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-3 px-4 font-semibold text-gray-300">Reservation #</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-300">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-300">Client</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-300">Total</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-300">Deposit</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.slice(0, 10).map((reservation) => (
                  <tr key={reservation.id} className="border-b border-gray-600 hover:bg-gray-600/50">
                    <td className="py-3 px-4 text-yellow-400 font-mono font-bold">
                      #{reservation.reservationNumber}
                    </td>
                    <td className="py-3 px-4 text-white">
                      {new Date(reservation.appointmentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-white">
                      {reservation.firstName} {reservation.lastName}
                    </td>
                    <td className="py-3 px-4 text-white font-semibold">
                      €{reservation.totalPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-white">
                      €{reservation.depositPaid.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        reservation.depositPaidStatus && reservation.restPaidStatus
                          ? 'bg-green-900/30 text-green-400'
                          : reservation.depositPaidStatus
                          ? 'bg-blue-900/30 text-blue-400'
                          : 'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {reservation.depositPaidStatus && reservation.restPaidStatus 
                          ? 'Fully Paid' 
                          : reservation.depositPaidStatus 
                          ? 'Deposit Paid' 
                          : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};