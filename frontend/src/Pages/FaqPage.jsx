import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react';


const FAQ = () => {
  const [faqs, setFaqs] = useState([]);
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openItems, setOpenItems] = useState(new Set());

  // Configure your API base URL here - matches your server setup
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003/api';

  // Fetch FAQs from the backend
  const fetchFaqs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching FAQs from:', `${API_BASE_URL}/faqs`);
      
      const response = await fetch(`${API_BASE_URL}/faqs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      
      if (data.success) {
        setFaqs(data.faqs || []);
        setFilteredFaqs(data.faqs || []);
      } else {
        setError(data.message || 'Failed to fetch FAQs');
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      setError('Unable to connect to the server. Please make sure your backend is running on port 5003.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchFaqs();
  }, []);

  // Filter FAQs based on search term and category
  useEffect(() => {
    let filtered = faqs;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(faq => 
        faq.category && faq.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(faq =>
        (faq.question && faq.question.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (faq.answer && faq.answer.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredFaqs(filtered);
  }, [faqs, searchTerm, selectedCategory]);

  // Get unique categories
  const categories = [...new Set(faqs.map(faq => faq.category).filter(Boolean))];

  // Toggle FAQ item open/closed
  const toggleItem = (id) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
            <span className="text-gray-600">Loading FAQs...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading FAQs</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-red-500">Troubleshooting steps:</p>
              <ul className="text-sm text-red-500 text-left max-w-md mx-auto">
                <li>• Make sure your backend server is running</li>
                <li>• Check that the server is on port 5003</li>
                <li>• Try: <code className="bg-red-100 px-1 rounded">npm start</code> in your backend folder</li>
                <li>• Test API: <a href="http://localhost:5003/api/faqs" target="_blank" rel="noopener noreferrer" className="underline">http://localhost:5003/api/faqs</a></li>
              </ul>
            </div>
            <button
              onClick={fetchFaqs}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (

    
    <div className="min-h-screen bg-gray-50">
      {/* Video Header Section */}
      <section className="relative mt-20">
        <div className="relative w-full h-[320px] sm:h-[420px] lg:h-[520px]">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/src/assets/images/pets-banner2.jpg"
          >
            <source src="/videos/5998833-uhd_4096_2160_25fps.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative container mx-auto max-w-4xl h-full px-4 py-8 text-center flex flex-col items-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-white">Frequently Asked Questions</h1>
            <p className="mt-auto mb-8 text-white/90">
              Find answers to common questions about our pet care services. 
              If you can't find what you're looking for, feel free to contact our support team.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="md:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredFaqs.length} of {faqs.length} FAQs
            {searchTerm && ` for "${searchTerm}"`}
            {selectedCategory !== 'all' && ` in ${selectedCategory}`}
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Search className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No FAQs Found</h3>
              <p className="text-gray-500 mb-4">
                {faqs.length === 0 
                  ? 'No FAQs have been added yet. Check back later or contact support.' 
                  : searchTerm || selectedCategory !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No FAQs available.'
                }
              </p>
              {(searchTerm || selectedCategory !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            filteredFaqs.map((faq) => (
              <div key={faq._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <button
                  onClick={() => toggleItem(faq._id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {faq.question}
                    </h3>
                    {faq.category && (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                        {faq.category}
                      </span>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    {openItems.has(faq._id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </button>
                
                {openItems.has(faq._id) && (
                  <div className="px-6 pb-6">
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {faq.answer}
                      </p>
                      {faq.createdAt && (
                        <p className="text-xs text-gray-400 mt-3">
                          Added: {new Date(faq.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchFaqs}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh FAQs'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FAQ;