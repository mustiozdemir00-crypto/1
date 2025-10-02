import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Search, Archive, Trash2, RefreshCw, Download, ChevronLeft, MailOpen, Clock } from 'lucide-react';

interface Email {
  id: string;
  message_id: string;
  from_address: string;
  from_name: string;
  to_addresses: string[];
  subject: string;
  body_text: string;
  body_html: string;
  is_read: boolean;
  is_archived: boolean;
  direction: 'inbound' | 'outbound';
  received_at: string;
}

interface EmailAttachment {
  id: string;
  email_id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  storage_path: string;
}

export const EmailViewer: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');

  useEffect(() => {
    fetchEmails();

    const emailsSubscription = supabase
      .channel('emails-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emails'
        },
        (payload) => {
          console.log('Email change detected:', payload);
          fetchEmails();
        }
      )
      .subscribe();

    return () => {
      emailsSubscription.unsubscribe();
    };
  }, [filter]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('emails')
        .select('*')
        .order('received_at', { ascending: false });

      if (filter === 'unread') {
        query = query.eq('is_read', false).eq('is_archived', false);
      } else if (filter === 'archived') {
        query = query.eq('is_archived', true);
      } else {
        query = query.eq('is_archived', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEmails(data || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachments = async (emailId: string) => {
    try {
      const { data, error } = await supabase
        .from('email_attachments')
        .select('*')
        .eq('email_id', emailId);

      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  const markAsRead = async (emailId: string) => {
    try {
      const { error } = await supabase
        .from('emails')
        .update({ is_read: true })
        .eq('id', emailId);

      if (error) throw error;

      setEmails(emails.map(email =>
        email.id === emailId ? { ...email, is_read: true } : email
      ));
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  };

  const toggleArchive = async (emailId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('emails')
        .update({ is_archived: !currentStatus })
        .eq('id', emailId);

      if (error) throw error;

      fetchEmails();
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
      }
    } catch (error) {
      console.error('Error archiving email:', error);
    }
  };

  const deleteEmail = async (emailId: string) => {
    if (!confirm('Are you sure you want to delete this email?')) return;

    try {
      const { error } = await supabase
        .from('emails')
        .delete()
        .eq('id', emailId);

      if (error) throw error;

      fetchEmails();
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
      }
    } catch (error) {
      console.error('Error deleting email:', error);
    }
  };

  const handleEmailClick = async (email: Email) => {
    setSelectedEmail(email);
    if (!email.is_read) {
      await markAsRead(email.id);
    }
    await fetchAttachments(email.id);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.from_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.body_text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unreadCount = emails.filter(e => !e.is_read && !e.is_archived).length;

  return (
    <div className="flex h-screen bg-gray-100">
      <div className={`${selectedEmail ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-96 bg-white border-r border-gray-200`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Mail className="text-red-600" size={24} />
              Company Mail
            </h2>
            <button
              onClick={fetchEmails}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} className="text-gray-600" />
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button
              onClick={() => setFilter('archived')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'archived'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Archive
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Mail size={48} className="mb-2 opacity-50" />
              <p>No emails found</p>
            </div>
          ) : (
            filteredEmails.map((email) => (
              <div
                key={email.id}
                onClick={() => handleEmailClick(email)}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedEmail?.id === email.id ? 'bg-red-50' : ''
                } ${!email.is_read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <p className={`font-medium text-gray-900 truncate flex-1 ${!email.is_read ? 'font-bold' : ''}`}>
                    {email.from_name || email.from_address}
                  </p>
                  <span className="text-xs text-gray-500 ml-2 flex items-center gap-1">
                    <Clock size={12} />
                    {formatDate(email.received_at)}
                  </span>
                </div>
                <p className={`text-sm mb-1 truncate ${!email.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                  {email.subject || '(No Subject)'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {email.body_text?.substring(0, 80) || '(No content)'}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={`${selectedEmail ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-white`}>
        {selectedEmail ? (
          <>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <h3 className="text-lg font-bold text-gray-900 flex-1 truncate">
                  {selectedEmail.subject || '(No Subject)'}
                </h3>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => toggleArchive(selectedEmail.id, selectedEmail.is_archived)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={selectedEmail.is_archived ? 'Unarchive' : 'Archive'}
                  >
                    <Archive size={18} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => deleteEmail(selectedEmail.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} className="text-red-600" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 w-20">From:</span>
                  <span className="text-gray-900">{selectedEmail.from_name || selectedEmail.from_address}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 w-20">To:</span>
                  <span className="text-gray-900">{selectedEmail.to_addresses.join(', ')}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 w-20">Date:</span>
                  <span className="text-gray-900">
                    {new Date(selectedEmail.received_at).toLocaleString('en-US', {
                      dateStyle: 'full',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {attachments.length > 0 && (
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <p className="font-semibold text-gray-700 mb-2 text-sm">Attachments ({attachments.length})</p>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Download size={16} className="text-gray-600" />
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900">{attachment.filename}</span>
                        <span className="text-xs text-gray-500">{formatFileSize(attachment.size_bytes)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
              {selectedEmail.body_html ? (
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                />
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-gray-900">
                  {selectedEmail.body_text || '(No content)'}
                </pre>
              )}
            </div>
          </>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center text-gray-400">
            <div className="text-center">
              <MailOpen size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select an email to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
