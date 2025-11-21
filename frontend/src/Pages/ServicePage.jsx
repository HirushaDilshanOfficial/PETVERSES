import  { useEffect, useState } from 'react'
import { Link } from 'react-router';
import RateLimitedUI from '../components/RateLimitedUI.jsx';
import api from "../lib/axios.js"
import ServiceCard from '../components/ServiceCard.jsx';
import toast from "react-hot-toast"
import { Search, MapPin, Filter, X } from 'lucide-react';
import Header from '../components/Header.jsx'; // Import the Header component



const ServicePage = () => {
  const [isRateLimited, setIsRateLimited]=useState(false);
  const [services, setServices]=useState([])
  const [filteredServices, setFilteredServices]=useState([])
  const [loading, setLoading] =useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'grooming', label: 'Grooming' },
    { value: 'boarding', label: 'Boarding & Daycare' },
    { value: 'training', label: 'Training' },
    { value: 'veterinary', label: 'Veterinary' },
    { value: 'other', label: 'Other' }
  ]

  
  useEffect(()=>{
    const fetchServices=async()=>{
      try{
        console.log('Fetching services...');
        const res=await api.get(`/services`);
        console.log('Services response:', res.data);
        console.log('Services array length:', res.data.length);
        // Debug: Check if any services have images
        res.data.forEach((service, index) => {
          console.log(`Service ${index}:`, {
            title: service.title,
            hasImages: service.images && service.images.length > 0,
            imageCount: service.images ? service.images.length : 0,
            firstImage: service.images && service.images.length > 0 ? service.images[0] : null
          });
        });
        setServices(res.data);
        setFilteredServices(res.data);
        setIsRateLimited(false);
      }catch(error){
        console.log("Error fetching services", error);
        console.log(error.response);
        if(error.response?.status===429){
          setIsRateLimited(true)
        }else{
          toast.error("failed to load services")
        }
      }finally{
        setLoading(false)
      }
    };
    fetchServices();
  },[])

  

  // Filter services based on search term and category
  useEffect(() => {
    let filtered = [...services];

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(service => 
        service.category && service.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search term (searches in title, description, and address)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(service => 
        (service.title && service.title.toLowerCase().includes(term)) ||
        (service.description && service.description.toLowerCase().includes(term)) ||
        (service.address && service.address.toLowerCase().includes(term))
      );
    }

    setFilteredServices(filtered);
  }, [services, searchTerm, selectedCategory]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
  };

  const hasActiveFilters = searchTerm.trim() || selectedCategory;

 return (

  
    // Changed from min-h-screen to min-h-screen bg-white to make background white
    <div className="min-h-screen bg-white">
      <Header /> {/* Add the Header component */}
      {isRateLimited && <RateLimitedUI />}

      <div className="max-w-7xl mx-auto p-4 mt-6">
        {/* Search and Filter Section */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border">
            <h1 className="text-3xl font-bold text-[#1E40AF] mb-6 text-center">
              Find Pet Services
            </h1>
            
            {/* Search Bar */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by service name, description, or location..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent text-gray-900"
              />
            </div>

            {/* Filter Toggle Button */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="bg-[#F97316] text-white text-xs px-2 py-1 rounded-full">
                    {(searchTerm.trim() ? 1 : 0) + (selectedCategory ? 1 : 0)}
                  </span>
                )}
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="border-t pt-4">
                {/* Category Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.value}
                        onClick={() => handleCategoryChange(category.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategory === category.value
                            ? 'bg-[#1E40AF] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Results Count */}
            <div className="text-sm text-gray-600 mt-4">
              {loading ? (
                'Loading services...'
              ) : (
                `Showing ${filteredServices.length} of ${services.length} services`
              )}
              {hasActiveFilters && !loading && (
                <span className="ml-2 text-[#F97316] font-medium">
                  (filtered)
                </span>
              )}
            </div>
          </div>
        </div>

        {loading && <div className="text-center text-[#1E40AF] py-10 font-semibold">Loading services...</div>}

        {!loading && services.length === 0 && !isRateLimited && (
          <div className="text-center text-gray-500 py-10 font-semibold">No services found</div>
        )}

        {!loading && filteredServices.length === 0 && services.length > 0 && !isRateLimited && (
          <div className="text-center py-10">
            <div className="text-gray-500 text-lg font-semibold mb-2">No services match your filters</div>
            <p className="text-gray-400 mb-4">Try adjusting your search criteria or clearing filters</p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-[#1E40AF] text-white rounded-lg hover:bg-[#F97316] transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {filteredServices.length > 0 && !isRateLimited && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard key={service._id} service={service} setServices={setServices}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default ServicePage