import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import toast from 'react-hot-toast';
import api from "../lib/axios";

const TIERS = [
  { key: 'basic', label: 'Basic' },
  { key: 'premium', label: 'Premium' },
  { key: 'luxury', label: 'Luxury' },
];

// --- Validation functions ---
const validateText = (value) => /^[a-zA-Z0-9\s,.-]+$/.test(value);
const validatePrice = (price) => {
  if (!price) return false;
  if (!/^\d+(\.\d{1,2})?$/.test(price)) return false;
  const val = Number(price);
  return val > 0 && val <= 20000;
};
const validateDuration = (duration) => /^[1-9]\d*\s*(minutes?|hours?|days?)$/.test(duration);
const validateServiceIncluded = (service) => /^[a-zA-Z0-9\s]+$/.test(service);

const CreateService = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const category = searchParams.get('category');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [packages, setPackages] = useState(
    TIERS.map(t => ({ tier: t.label, price: '', duration: '', included: [], includeInput: '' }))
  );

  const [errors, setErrors] = useState({
    title: '',
    description: '',
    address: '',
    images: '',
    category: '',
    packages: TIERS.map(() => ({ price: '', duration: '', included: '' })),
  });

  // track touched fields
  const [touched, setTouched] = useState({
    packages: TIERS.map(() => ({ price: false, duration: false, included: false })),
  });

  const previews = useMemo(
    () => images.map(file => ({ name: file.name, url: URL.createObjectURL(file) })),
    [images]
  );

  useEffect(() => {
    return () => previews.forEach(p => URL.revokeObjectURL(p.url));
  }, [previews]);

  // --- Real-time input blocking ---
  const handleTextInput = (setter) => (e) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9\s,.-]/g, '');
    setter(value);
  };

  const handlePriceInput = (idx) => (e) => {
    let value = e.target.value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) value = parts[0] + '.' + parts[1];
    if (value.length > 7) value = value.slice(0, 7);
    updatePackageField(idx, 'price', value);
  };

  const handleDurationInput = (idx) => (e) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '');
    updatePackageField(idx, 'duration', value);
  };

  const handleServiceInput = (idx) => (e) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '');
    updatePackageField(idx, 'includeInput', value);
  };

  // --- Field change handlers ---
  useEffect(() => {
    if (!category) setErrors(prev => ({ ...prev, category: 'Please choose a category' }));
    else setErrors(prev => ({ ...prev, category: '' }));
  }, [category]);

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length !== 1) setErrors(prev => ({ ...prev, images: 'Please upload exactly one image' }));
    else {
      setErrors(prev => ({ ...prev, images: '' }));
      setImages(files);
    }
  };

  const updatePackageField = (idx, field, value) => {
    setPackages(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addIncludedService = (idx) => {
    setPackages(prev => {
      const next = [...prev];
      const input = (next[idx].includeInput || '').trim();
      if (!input) return prev;

      if (!validateServiceIncluded(input)) {
        const newErrors = [...errors.packages];
        newErrors[idx].included = 'Invalid characters';
        setErrors(prev => ({ ...prev, packages: newErrors }));
        return prev;
      }

      if (next[idx].included.includes(input)) {
        const newErrors = [...errors.packages];
        newErrors[idx].included = 'Duplicate service';
        setErrors(prev => ({ ...prev, packages: newErrors }));
        return prev;
      }

      next[idx] = { ...next[idx], included: [...next[idx].included, input], includeInput: '' };
      const newErrors = [...errors.packages];
      newErrors[idx].included = '';
      setErrors(prev => ({ ...prev, packages: newErrors }));

      return next;
    });
  };

  const removeIncludedService = (idx, itemIndex) => {
    setPackages(prev => {
      const next = [...prev];
      const filtered = next[idx].included.filter((_, i) => i !== itemIndex);
      next[idx] = { ...next[idx], included: filtered };
      return next;
    });
  };

  // --- Validate packages ---
  const validatePackages = (onSubmit = false) => {
    const newErrors = packages.map((pkg, idx) => {
      const err = { price: '', duration: '', included: '' };
      
      // Only validate if the package has any data (price OR duration OR included services)
      const hasAnyData = pkg.price || pkg.duration || pkg.included.length > 0;
      
      if (hasAnyData) {
        // Price validation
        if ((touched.packages[idx].price || onSubmit) && !pkg.price) {
          err.price = 'Price is required';
        } else if ((touched.packages[idx].price || onSubmit) && pkg.price && !validatePrice(pkg.price)) {
          err.price = 'Invalid price';
        }

        // Duration validation
        if ((touched.packages[idx].duration || onSubmit) && !pkg.duration) {
          err.duration = 'Duration is required';
        } else if ((touched.packages[idx].duration || onSubmit) && pkg.duration && !validateDuration(pkg.duration)) {
          err.duration = 'Invalid duration';
        }

        // Services included validation
        if (onSubmit && pkg.included.length === 0) {
          err.included = 'At least 1 service required';
        }
      }

      return err;
    });

    // Hierarchy check for filled packages only
    const filledPackages = packages.map((pkg, idx) => ({ 
      ...pkg, 
      price: Number(pkg.price) || 0, 
      idx 
    })).filter(pkg => pkg.price > 0);

    const basic = filledPackages.find(p => p.tier === 'Basic');
    const premium = filledPackages.find(p => p.tier === 'Premium');
    const luxury = filledPackages.find(p => p.tier === 'Luxury');

    if (basic && premium && basic.price >= premium.price) {
      newErrors[basic.idx].price = "Basic can't be >= Premium";
    }
    if (premium && luxury && premium.price >= luxury.price) {
      newErrors[premium.idx].price = "Premium can't be >= Luxury";
    }
    if (basic && luxury && basic.price >= luxury.price) {
      newErrors[basic.idx].price = "Basic can't be >= Luxury";
    }

    setErrors(prev => ({ ...prev, packages: newErrors }));
  };

  useEffect(() => {
    validatePackages(false);
  }, [packages, touched]);

  const hasErrors = useMemo(() => {
    // Check basic required fields
    if (!title || !description || !address || !category || images.length !== 1) return true;
    if (errors.title || errors.description || errors.address || errors.images || errors.category) return true;

    // Check that at least one complete package exists
    const completePackages = packages.filter((pkg, idx) => {
      return pkg.price && 
             pkg.duration && 
             pkg.included.length > 0 && 
             !errors.packages[idx]?.price && 
             !errors.packages[idx]?.duration && 
             !errors.packages[idx]?.included;
    });

    // Require at least one complete package
    if (completePackages.length === 0) return true;

    return false;
  }, [errors, title, description, address, category, images, packages]);

  // --- Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    validatePackages(true);

    if (hasErrors) {
      toast.error("Please fix errors before submitting");
      return;
    }

    setLoading(true);
    try {
      const payloadPackages = packages
        .filter(p => p.price && p.duration && p.included.length > 0)
        .map(p => ({
          name: p.tier,
          price: Number(p.price),
          duration: p.duration,
          services: p.included
        }));

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('address', address);
      formData.append('category', category);
      formData.append('packages', JSON.stringify(payloadPackages));
      images.forEach(file => formData.append('images', file));

      await api.post("/services", formData, { headers: { 'Content-Type': 'multipart/form-data' } });

      toast.success("Service created successfully!");
      navigate("/dashboard/service-provider");
    } catch (error) {
      console.log('Error creating service:', error.response?.data);
      toast.error(error.response?.data?.message || "Failed to create service");
    } finally {
      setLoading(false);
    }
  };

  // --- JSX ---
  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link to={"/dashboard/service-provider"} className="btn btn-ghost">
              <ArrowLeftIcon className="size-5" /> Back to Dashboard
            </Link>
          </div>

          {!category && (
            <div className="alert alert-warning mb-6">
              <span>Please choose a category.</span>
              <Link to="/services/create/select" className="btn btn-sm ml-2">Choose Category</Link>
            </div>
          )}

          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <h2 className="card-title text-2xl">Create New Service</h2>
                {category && (
                  <div className="badge capitalize bg-blue-600 text-white px-6 py-3 text-lg">{category}</div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                {/* Title */}
                <div className="form-control">
                  <label className="label"><span className="label-text">Title</span></label>
                  <input
                    type="text"
                    placeholder="Service Title"
                    className={`input input-bordered ${errors.title ? 'border-red-500' : ''}`}
                    value={title}
                    onChange={handleTextInput(setTitle)}
                  />
                  {errors.title && <span className="text-red-500 text-sm">{errors.title}</span>}
                </div>

                {/* Description */}
                <div className="form-control">
                  <label className="label"><span className="label-text">Description</span></label>
                  <textarea
                    placeholder="Describe your service..."
                    className={`textarea textarea-bordered h-32 ${errors.description ? 'border-red-500' : ''}`}
                    value={description}
                    onChange={handleTextInput(setDescription)}
                  />
                  {errors.description && <span className="text-red-500 text-sm">{errors.description}</span>}
                </div>

                {/* Address */}
                <div className="form-control">
                  <label className="label"><span className="label-text">Location</span></label>
                  <input
                    type="text"
                    placeholder="City, Area"
                    className={`input input-bordered ${errors.address ? 'border-red-500' : ''}`}
                    value={address}
                    onChange={handleTextInput(setAddress)}
                  />
                  {errors.address && <span className="text-red-500 text-sm">{errors.address}</span>}
                </div>

                {/* Image */}
                <div className="form-control">
                  <label className="label"><span className="label-text">Image</span></label>
                  <input
                    type="file"
                    className={`file-input file-input-bordered ${errors.images ? 'border-red-500' : ''}`}
                    accept="image/*"
                    onChange={handleImagesChange}
                  />
                  {errors.images && <span className="text-red-500 text-sm">{errors.images}</span>}
                  {previews.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {previews.map(p => (
                        <div key={p.url} className="avatar">
                          <div className="w-24 h-24 rounded">
                            <img src={p.url} alt={p.name} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Packages */}
                <div className="divider">Packages</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {packages.map((pkg, idx) => (
                    <div key={pkg.tier} className="card bg-base-200">
                      <div className="card-body gap-3">
                        <h3 className="card-title text-xl">{pkg.tier}</h3>

                        {/* Price */}
                        <div className="form-control">
                          <label className="label"><span className="label-text">Price</span></label>
                          <input
                            type="text"
                            placeholder="0.00"
                            className={`input input-bordered ${errors.packages[idx]?.price ? 'border-red-500' : ''}`}
                            value={pkg.price}
                            onChange={handlePriceInput(idx)}
                            onBlur={() =>
                              setTouched(prev => {
                                const next = { ...prev };
                                next.packages[idx].price = true;
                                return next;
                              })
                            }
                          />
                          {errors.packages[idx]?.price && (
                            <span className="text-red-500 text-sm">{errors.packages[idx].price}</span>
                          )}
                        </div>

                        {/* Duration */}
                        <div className="form-control">
                          <label className="label"><span className="label-text">Duration</span></label>
                          <input
                            type="text"
                            placeholder="30 minutes, 2 hours or 1 day"
                            className={`input input-bordered ${errors.packages[idx]?.duration ? 'border-red-500' : ''}`}
                            value={pkg.duration}
                            onChange={handleDurationInput(idx)}
                            onBlur={() =>
                              setTouched(prev => {
                                const next = { ...prev };
                                next.packages[idx].duration = true;
                                return next;
                              })
                            }
                          />
                          {errors.packages[idx]?.duration && (
                            <span className="text-red-500 text-sm">{errors.packages[idx].duration}</span>
                          )}
                        </div>

                        {/* Services Included */}
                        <div className="form-control">
                          <label className="label"><span className="label-text">Services Included</span></label>
                          <input
                            type="text"
                            placeholder="Add a service..."
                            className="input input-bordered"
                            value={pkg.includeInput}
                            onChange={handleServiceInput(idx)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addIncludedService(idx);
                              }
                            }}
                            onBlur={() =>
                              setTouched(prev => {
                                const next = { ...prev };
                                return next;
                              })
                            }
                          />
                          <button
                            type="button"
                            className="btn btn-outline btn-sm mt-2"
                            onClick={() => addIncludedService(idx)}
                          >
                            <PlusIcon className="size-3" /> Add
                          </button>
                          {pkg.included.length > 0 && (
                            <ul className="mt-3 space-y-2">
                              {pkg.included.map((item, i) => (
                                <li key={`${pkg.tier}-${i}`} className="flex items-center justify-between bg-base-100 px-3 py-2 rounded">
                                  <span className="text-sm">{item}</span>
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-xs"
                                    onClick={() => removeIncludedService(idx, i)}
                                  >
                                    <Trash2Icon className="size-4" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                          {errors.packages[idx]?.included && (
                            <span className="text-red-500 text-sm">{errors.packages[idx].included}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit */}
                <div className="card-actions justify-end">
                  <button
                    type="submit"
                    disabled={hasErrors || loading}
                    className={`px-20 py-2 rounded-lg bg-blue-600 text-white hover:bg-orange-500 hover:scale-105 transform transition-all duration-300 ${hasErrors || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Creating...' : 'Create Service'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateService;