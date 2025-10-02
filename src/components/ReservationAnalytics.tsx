import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Calendar, Clock, TrendingUp, Users, Eye, Download } from 'lucide-react';
import { ImageModal } from './ImageModal';
import { ReservationModal } from './ReservationModal';
import { generatePDF } from '../utils/pdfGenerator';

export const ReservationAnalytics: React.FC = () => {
  const { reservations, staff, loading } = useData();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'yesterday' | 'week' | 'month'>('today');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);

  const getDateRange = (period: 'today' | 'yesterday' | 'week' | 'month') => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          start: yesterday,
          end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
          start: weekAgo,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return {
          start: monthAgo,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      default:
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) };
    }
  };

  const filteredReservations = useMemo(() => {
    const range = getDateRange(selectedPeriod);
    return reservations.filter(reservation => {
      const createdDate = new Date(reservation.createdAt);
      return createdDate >= range.start && createdDate <= range.end;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reservations, selectedPeriod]);

  const analytics = useMemo(() => {
    const totalRevenue = filteredReservations.reduce((sum, res) => sum + res.totalPrice, 0);
    const totalDeposits = filteredReservations.reduce((sum, res) => sum + res.depositPaid, 0);
    const averageTicket = filteredReservations.length > 0 ? totalRevenue / filteredReservations.length : 0;
    const paidReservations = filteredReservations.filter(res => res.depositPaidStatus && res.restPaidStatus);

    return {
      totalReservations: filteredReservations.length,
      totalRevenue,
      totalDeposits,
      averageTicket,
      fullyPaidCount: paidReservations.length,
      pendingCount: filteredReservations.length - paidReservations.length
    };
  }, [filteredReservations]);

  const getArtistName = (artistId?: string) => {
    if (!artistId) return 'Not assigned';
    const artist = staff.find(s => s.id === artistId);
    return artist?.name || 'Not assigned';
  };

  const handleDownloadPDF = (reservation: any) => {
    const artist = staff.find(s => s.id === reservation.artistId);
    generatePDF(reservation, artist?.name || 'Not assigned');
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'week': return 'Last 7 Days';
      case 'month': return 'Last 30 Days';
      default: return 'Today';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 border border-orange-900 rounded-2xl shadow-lg p-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <p className="text-orange-300 mt-2">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-black border border-red-900 rounded-2xl shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">Reservation Analytics</h1>
          <p className="text-white">Track reservations by creation date</p>
        </div>

        {/* Period Selection */}
        <div className="mb-8 bg-gray-900 border border-red-800 rounded-lg p-6">
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'today', label: 'Today' },
              { key: 'yesterday', label: 'Yesterday' },
              { key: 'week', label: 'Last 7 Days' },
              { key: 'month', label: 'Last 30 Days' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedPeriod(key as any)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  selectedPeriod === key
                    ? 'bg-yellow-600 text-black'
                    : 'bg-gray-600 text-white hover:bg-gray-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 border border-blue-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">New Reservations</p>
                <p className="text-2xl font-bold text-white">{analytics.totalReservations}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-900 to-green-800 border border-green-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-white">€{analytics.totalRevenue.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-900 to-yellow-800 border border-yellow-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-300 text-sm font-medium">Average Ticket</p>
                <p className="text-2xl font-bold text-white">€{analytics.averageTicket.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-900 to-purple-800 border border-purple-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium">Fully Paid</p>
                <p className="text-2xl font-bold text-white">{analytics.fullyPaidCount}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Reservations Table */}
        <div className="bg-gray-700 border border-gray-600 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Reservations Created {getPeriodLabel(selectedPeriod)}
          </h3>
          
          {filteredReservations.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto w-16 h-16 text-yellow-400 mb-4" />
              <p className="text-white text-lg">No reservations found</p>
              <p className="text-gray-400">No reservations were created {getPeriodLabel(selectedPeriod).toLowerCase()}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Reservation #</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Client</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Created</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Appointment</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Artist</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Price</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((reservation) => (
                    <tr key={reservation.id} className="border-b border-gray-600 hover:bg-gray-600/50">
                      <td className="py-3 px-4 text-yellow-400 font-mono font-bold">
                        <button
                          onClick={() => setSelectedReservationId(reservation.id)}
                          className="hover:text-yellow-300 transition-colors cursor-pointer"
                        >
                          #{reservation.reservationNumber}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          {reservation.designImages.length > 0 && (
                            <button
                              onClick={() => {
                                setSelectedImages(reservation.designImages);
                                setSelectedImageIndex(0);
                              }}
                              className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-600 hover:border-yellow-500 transition-colors flex-shrink-0"
                            >
                              <img
                                src={reservation.designImages[0]}
                                alt="Design"
                                className="w-full h-full object-cover"
                              />
                            </button>
                          )}
                          <div>
                            <div className="font-medium text-white">
                              {reservation.firstName} {reservation.lastName}
                            </div>
                            <div className="text-sm text-gray-400">{reservation.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div className="font-medium text-white">
                            {new Date(reservation.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-gray-400 flex items-center">
                            <Clock size={12} className="mr-1" />
                            {new Date(reservation.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div className="font-medium text-white">
                            {new Date(reservation.appointmentDate).toLocaleDateString()}
                          </div>
                          <div className="text-gray-400">{reservation.appointmentTime}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-white">{getArtistName(reservation.artistId)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div className="font-medium text-white">€{reservation.totalPrice.toFixed(2)}</div>
                          <div className="text-gray-400">Deposit: €{reservation.depositPaid.toFixed(2)}</div>
                        </div>
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
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedReservationId(reservation.id)}
                          className="p-2 text-green-400 hover:bg-green-900/20 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(reservation)}
                          className="p-2 text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedImages.length > 0 && (
        <ImageModal
          images={selectedImages}
          currentIndex={selectedImageIndex}
          onClose={() => {
            setSelectedImages([]);
            setSelectedImageIndex(0);
          }}
          onNavigate={setSelectedImageIndex}
        />
      )}

      {selectedReservationId && (
        <ReservationModal
          reservationId={selectedReservationId}
          onClose={() => setSelectedReservationId(null)}
        />
      )}
    </div>
  );
};