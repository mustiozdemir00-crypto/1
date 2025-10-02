import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Search, Filter, Eye, CreditCard as Edit, Trash2, Download, Calendar, CheckCircle, X, Save, Send } from 'lucide-react';
import { ImageModal } from './ImageModal';
import { ReservationModal } from './ReservationModal';
import { generatePDF } from '../utils/pdfGenerator';
import { TimeSelector } from './TimeSelector';
import { DateSelector } from './DateSelector';

export const ViewReservations: React.FC = () => {
  const { reservations, updateReservation, deleteReservation, staff, loading } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [editingReservation, setEditingReservation] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    appointmentDate: '',
    appointmentTime: '',
    totalPrice: '',
    depositPaid: '',
    notes: '',
    artistId: ''
  });
  const [sendingDailyReservations, setSendingDailyReservations] = useState(false);

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      reservation.reservationNumber.toString().includes(searchTerm) ||
      reservation.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.phone.includes(searchTerm);
    
    const reservationDate = new Date(reservation.appointmentDate);
    const startDate = new Date(dateFilter.start);
    const endDate = new Date(dateFilter.end);
    
    const matchesDate = reservationDate >= startDate && reservationDate <= endDate;
    
    return matchesSearch && matchesDate;
  });

  const handleStatusToggle = (reservationId: string, isPaid: boolean) => {
    updateReservation(reservationId, { isPaid });
  };

  const handleDelete = (reservationId: string) => {
    if (window.confirm('Are you sure you want to delete this reservation?')) {
      deleteReservation(reservationId);
    }
  };

  const handleDownloadPDF = (reservation: any) => {
    const artist = staff.find(s => s.id === reservation.artistId);
    generatePDF(reservation, artist?.name || 'Not assigned');
  };

  const handleEdit = (reservation: any) => {
    setEditingReservation(reservation.id);
    setEditFormData({
      firstName: reservation.firstName,
      lastName: reservation.lastName,
      phone: reservation.phone,
      appointmentDate: reservation.appointmentDate,
      appointmentTime: reservation.appointmentTime,
      totalPrice: reservation.totalPrice.toString(),
      depositPaid: reservation.depositPaid.toString(),
      notes: reservation.notes || '',
      artistId: reservation.artistId || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingReservation) return;
    
    try {
      await updateReservation(editingReservation, {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        phone: editFormData.phone,
        appointmentDate: editFormData.appointmentDate,
        appointmentTime: editFormData.appointmentTime,
        totalPrice: parseFloat(editFormData.totalPrice),
        depositPaid: parseFloat(editFormData.depositPaid),
        notes: editFormData.notes,
        artistId: editFormData.artistId || undefined
      });
      setEditingReservation(null);
    } catch (error) {
      console.error('Error updating reservation:', error);
      alert('Error updating reservation. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingReservation(null);
    setEditFormData({
      firstName: '',
      lastName: '',
      phone: '',
      appointmentDate: '',
      appointmentTime: '',
      totalPrice: '',
      depositPaid: '',
      notes: '',
      artistId: ''
    });
  };

  const getArtists = () => {
    return staff.filter(s => s.role === 'artist');
  };

  const getArtistName = (artistId?: string) => {
    if (!artistId) return 'Not assigned';
    const artist = staff.find(s => s.id === artistId);
    return artist?.name || 'Not assigned';
  };

  const handleSendTomorrowsReservations = async () => {
    setSendingDailyReservations(true);
    
    try {
      // Get tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split('T')[0];
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-reservation-summary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: tomorrowDate,
          manual: true
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`Tomorrow's reservations (${tomorrow.toLocaleDateString()}) sent successfully!`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending tomorrow\'s reservations:', error);
      alert('Error sending tomorrow\'s reservations');
    } finally {
      setSendingDailyReservations(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white border border-gray-300 rounded-2xl shadow-xl p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 tracking-wide">View & Manage Reservations</h1>
          <p className="text-gray-600">Manage all your studio appointments</p>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500" size={20} />
              <input
                type="text"
                placeholder="Search by reservation #, name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all placeholder-gray-500 shadow-sm"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                className="px-4 py-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                className="px-4 py-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm"
              />
            </div>
          </div>
          
          <div>
            <button
              onClick={handleSendTomorrowsReservations}
              disabled={sendingDailyReservations}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              <Send size={20} />
              <span>{sendingDailyReservations ? 'Sending...' : 'Send Tomorrow\'s Reservations'}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-100">
                <th className="text-left py-4 px-4 font-semibold text-gray-800">Reservation #</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-800">Client</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-800">Date & Time</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-800">Artist</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-800">Price</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-800">Payment Status</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((reservation) => (
                <React.Fragment key={reservation.id}>
                  <tr className={`border-b border-gray-200 hover:bg-white transition-colors ${reservation.isPaid ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => setSelectedReservationId(reservation.id)}
                        className="font-mono text-red-600 font-bold text-lg hover:text-red-800 transition-colors cursor-pointer hover:underline"
                      >
                        #{reservation.reservationNumber}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        {reservation.designImages.length > 0 && (
                          <button
                            onClick={() => {
                              setSelectedImages(reservation.designImages);
                              setSelectedImageIndex(0);
                            }}
                            className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-300 hover:border-red-500 transition-colors flex-shrink-0"
                          >
                            <img
                              src={reservation.designImages[0]}
                              alt="Design"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        )}
                        <div className="flex-1">
                          {editingReservation === reservation.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editFormData.firstName}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                className="w-full px-2 py-1 bg-white border border-gray-300 text-gray-900 rounded text-sm"
                                placeholder="First Name"
                              />
                              <input
                                type="text"
                                value={editFormData.lastName}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                className="w-full px-2 py-1 bg-white border border-gray-300 text-gray-900 rounded text-sm"
                                placeholder="Last Name"
                              />
                              <input
                                type="tel"
                                value={editFormData.phone}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                                className="w-full px-2 py-1 bg-white border border-gray-300 text-gray-900 rounded text-sm"
                                placeholder="Phone"
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium text-gray-900">
                                {reservation.firstName} {reservation.lastName}
                              </div>
                              <div className="text-sm text-gray-400">{reservation.phone}</div>
                              <div className="text-xs text-gray-600 flex items-center mt-1">
                                <Calendar size={10} className="mr-1" />
                                Created: {new Date(reservation.createdAt).toLocaleDateString()} at {new Date(reservation.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {editingReservation === reservation.id ? (
                        <div className="space-y-2">
                          <DateSelector
                            value={editFormData.appointmentDate}
                            onChange={(date) => setEditFormData(prev => ({ ...prev, appointmentDate: date }))}
                            className="text-sm px-2 py-1"
                          />
                          <TimeSelector
                            value={editFormData.appointmentTime}
                            onChange={(time) => setEditFormData(prev => ({ ...prev, appointmentTime: time }))}
                            className="text-sm px-2 py-1"
                          />
                        </div>
                      ) : (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {new Date(reservation.appointmentDate).toLocaleDateString()}
                          </div>
                          <div className="text-gray-400">{reservation.appointmentTime}</div>
                          <div className="text-gray-500">{reservation.appointmentTime}</div>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {editingReservation === reservation.id ? (
                        <select
                          value={editFormData.artistId}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, artistId: e.target.value }))}
                          className="w-full px-2 py-1 bg-white border border-gray-300 text-gray-900 rounded text-sm"
                        >
                          <option value="">Select artist</option>
                          {getArtists().map(artist => (
                            <option key={artist.id} value={artist.id}>{artist.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-gray-900">{getArtistName(reservation.artistId)}</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {editingReservation === reservation.id ? (
                        <div className="space-y-2">
                          <label className="block text-xs text-gray-600">Total Price (€)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editFormData.totalPrice}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, totalPrice: e.target.value }))}
                            className="w-full px-2 py-1 bg-white border border-gray-300 text-gray-900 rounded text-sm"
                            placeholder="Total Price"
                          />
                          <label className="block text-xs text-gray-600">Deposit (€)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editFormData.depositPaid}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, depositPaid: e.target.value }))}
                            className="w-full px-2 py-1 bg-white border border-gray-300 text-gray-900 rounded text-sm"
                            placeholder="Deposit"
                          />
                          <div className="text-xs text-gray-600">
                            Remaining: €{editFormData.totalPrice && editFormData.depositPaid 
                              ? (parseFloat(editFormData.totalPrice) - parseFloat(editFormData.depositPaid)).toFixed(2)
                              : '0.00'}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">€{reservation.totalPrice.toFixed(2)}</div>
                          <div className="text-gray-500">Deposit: €{reservation.depositPaid.toFixed(2)}</div>
                          <div className="text-gray-500">Remaining: €{(reservation.totalPrice - reservation.depositPaid).toFixed(2)}</div>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-2">
                        <button
                          onClick={() => updateReservation(reservation.id, { 
                            depositPaidStatus: !reservation.depositPaidStatus 
                          })}
                          className={`w-full px-3 py-1 rounded text-xs font-medium transition-colors ${
                            reservation.depositPaidStatus
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {reservation.depositPaidStatus ? (
                            <>
                              <CheckCircle size={12} className="inline mr-1" />
                              Deposit Paid
                            </>
                          ) : (
                            'Mark Deposit Paid'
                          )}
                        </button>
                        <button
                          onClick={() => updateReservation(reservation.id, { 
                            restPaidStatus: !reservation.restPaidStatus,
                            isPaid: !reservation.restPaidStatus ? true : reservation.isPaid
                          })}
                          className={`w-full px-3 py-1 rounded text-xs font-medium transition-colors ${
                            reservation.restPaidStatus
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {reservation.restPaidStatus ? (
                            <>
                              <CheckCircle size={12} className="inline mr-1" />
                              Rest Paid
                            </>
                          ) : (
                            'Mark Rest Paid'
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        {editingReservation === reservation.id ? (
                          <>
                            <button
                              onClick={handleSaveEdit}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Save"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setSelectedReservationId(reservation.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleEdit(reservation)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDownloadPDF(reservation)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Download PDF"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(reservation.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {editingReservation === reservation.id && (
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <td colSpan={7} className="py-4 px-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                          <textarea
                            value={editFormData.notes}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded"
                            rows={3}
                            placeholder="Add notes..."
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReservations.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto w-16 h-16 text-red-500 mb-4" />
            <p className="text-gray-900 text-lg">No reservations found</p>
            <p className="text-gray-600">Try adjusting your search or date filters</p>
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="text-gray-900 mt-2">Loading reservations...</p>
        </div>
      )}

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