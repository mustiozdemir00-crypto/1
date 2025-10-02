import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Upload, X, Calendar, Clock, DollarSign, Phone, User } from 'lucide-react';
import { TimeSelector } from './TimeSelector';
import { DateSelector } from './DateSelector';

interface NewReservationProps {
  onReservationCreated?: () => void;
}

export const NewReservation: React.FC<NewReservationProps> = ({ onReservationCreated }) => {
  const { addReservation, getArtists, loading } = useData();
  
  // Get current date and time for defaults
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    appointmentDate: currentDate,
    appointmentTime: '', // Will be auto-set by TimeSelector
    totalPrice: '',
    depositPaid: '',
    artistId: '',
    notes: ''
  });
  const [designImages, setDesignImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Calculate remaining amount
  const remainingAmount = formData.totalPrice && formData.depositPaid 
    ? (parseFloat(formData.totalPrice) - parseFloat(formData.depositPaid)).toFixed(2)
    : '0.00';

  const artists = getArtists();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploading(true);
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setDesignImages(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      });
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setDesignImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSubmitting(true);
    
    try {
      await addReservation({
        reservationNumber: 0, // Will be set by the database
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        totalPrice: parseFloat(formData.totalPrice),
        depositPaid: parseFloat(formData.depositPaid),
        isPaid: false,
        depositPaidStatus: false,
        restPaidStatus: false,
        designImages,
        notes: formData.notes,
        artistId: formData.artistId
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Show success message
      alert('Reservation created successfully!');
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        appointmentDate: currentDate,
        appointmentTime: currentTime,
        totalPrice: '',
        depositPaid: '',
        artistId: '',
        notes: ''
      });
      setDesignImages([]);
      
      // Redirect to reservations page
      if (onReservationCreated) {
        onReservationCreated();
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('Error creating reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 border border-red-900 rounded-2xl shadow-lg p-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="text-red-300 mt-2 font-metal">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white border border-gray-300 rounded-2xl shadow-xl p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 tracking-wide">New Reservation</h1>
          <p className="text-gray-600">Create a new appointment booking</p>
        </div>

        {success && (
          <div className="mb-6 bg-green-50 border border-green-300 rounded-lg p-4 shadow-sm">
            <p className="text-green-800 font-medium">Reservation created successfully!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-2" />
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all placeholder-gray-500 shadow-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-2" />
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline w-4 h-4 mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-2" />
                Appointment Date
              </label>
              <DateSelector
                value={formData.appointmentDate}
                onChange={(date) => setFormData(prev => ({ ...prev, appointmentDate: date }))}
                minDate={currentDate}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-2" />
                Appointment Time
              </label>
              <TimeSelector
                value={formData.appointmentTime}
                onChange={(time) => setFormData(prev => ({ ...prev, appointmentTime: time }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tattoo Artist
              </label>
              <select
                name="artistId"
                value={formData.artistId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              >
                <option value="">Select an artist (optional)</option>
                {artists.map(artist => (
                  <option key={artist.id} value={artist.id}>{artist.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline w-4 h-4 mr-2" />
                Total Price (€)
              </label>
              <input
                type="number"
                step="0.01"
                name="totalPrice"
                value={formData.totalPrice}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline w-4 h-4 mr-2" />
                Deposit Paid (€)
              </label>
              <input
                type="number"
                step="0.01"
                name="depositPaid"
                value={formData.depositPaid}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder-gray-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline w-4 h-4 mr-2" />
                Remaining Amount (€)
              </label>
              <input
                type="text"
                value={`€${remainingAmount}`}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
                disabled
                readOnly
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder-gray-500"
              placeholder="Add any additional notes..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              <Upload className="inline w-4 h-4 mr-2" />
              Upload Tattoo Designs
            </label>
            <div className="border-2 border-dashed border-red-300 rounded-lg p-6 text-center bg-red-50">
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="design-upload"
              />
              <label
                htmlFor="design-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-colors font-semibold"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </label>
              <p className="text-sm text-gray-600 mt-2">
                Support: JPEG, PNG, PDF files
              </p>
            </div>

            {designImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {designImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Design ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold"
            >
              {submitting ? 'Creating...' : 'Create Reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};