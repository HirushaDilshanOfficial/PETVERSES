import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeftIcon, PlusIcon, Trash2Icon } from "lucide-react";
import toast from "react-hot-toast";
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

const EditService = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [packages, setPackages] = useState(
    TIERS.map(t => ({ tier: t.label, price: '', duration: '', included: [], includeInput: '' }))
  );
  const [errors, setErrors] = useState({
    title: '', description: '', address: '',
    packages: TIERS.map(() => ({ price: '', duration: '', included: '' })),
  });
  const [touched, setTouched] = useState({
    packages: TIERS.map(() => ({ price: false, duration: false, included: false })),
  });

  useEffect(() => {
    let mounted = true;
    const fetchService = async () => {
      try {
        const res = await api.get(`/services/${id}`);
        const s = res.data;
        if (!mounted || !s) return;

        setTitle(s.title || '');
        setDescription(s.description || '');
        setAddress(s.address || '');
        if (Array.isArray(s.packages) && s.packages.length > 0) {
          const mapped = TIERS.map(tier => {
            const pkg = s.packages.find(p => p.name.toLowerCase() === tier.label.toLowerCase());
            return pkg ? { 
              tier: tier.label,
              price: pkg.price || '',
              duration: pkg.duration || '',
              included: Array.isArray(pkg.services) ? pkg.services : [],
              includeInput: ''
            } : { tier: tier.label, price: '', duration: '', included: [], includeInput: '' };
          });
          setPackages(mapped);
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load service");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchService();
    return () => { mounted = false; };
  }, [id]);

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
      if (next[idx].included.includes(input)) return prev;

      next[idx] = { ...next[idx], included: [...next[idx].included, input], includeInput: '' };
      const newErrors = [...errors.packages];
      newErrors[idx].included = '';
      setErrors(prev => ({ ...prev, packages: newErrors }));
      return next;
    });
  };

  const removeIncludedService = (idx, i) => {
    setPackages(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], included: next[idx].included.filter((_, j) => j !== i) };
      return next;
    });
  };

  // --- Validation ---
  const validatePackages = (onSubmit = false) => {
    const newErrors = packages.map((pkg, idx) => {
      const err = { price: '', duration: '', included: '' };
      const hasData = pkg.price || pkg.duration || pkg.included.length > 0;

      if (hasData) {
        if (!pkg.price) err.price = 'Price required';
        else if (!validatePrice(pkg.price)) err.price = 'Invalid price';

        if (!pkg.duration) err.duration = 'Duration required';
        else if (!validateDuration(pkg.duration)) err.duration = 'Invalid format';

        if (onSubmit && pkg.included.length === 0) err.included = 'At least 1 service required';
      }
      return err;
    });

    // Hierarchy check: Basic < Premium < Luxury
    const filled = packages.filter(p => p.price);
    const basic = filled.find(p => p.tier === 'Basic');
    const premium = filled.find(p => p.tier === 'Premium');
    const luxury = filled.find(p => p.tier === 'Luxury');
    if (basic && premium && Number(basic.price) >= Number(premium.price)) newErrors[0].price = "Basic can't be >= Premium";
    if (premium && luxury && Number(premium.price) >= Number(luxury.price)) newErrors[1].price = "Premium can't be >= Luxury";
    if (basic && luxury && Number(basic.price) >= Number(luxury.price)) newErrors[0].price = "Basic can't be >= Luxury";

    setErrors(prev => ({ ...prev, packages: newErrors }));
  };

  useEffect(() => { validatePackages(false); }, [packages]);

  const hasErrors = useMemo(() => {
    if (!title || !description || !address) return true;
    if (errors.title || errors.description || errors.address) return true;
    const completePackages = packages.filter((pkg, idx) => pkg.price && pkg.duration && pkg.included.length > 0 && !errors.packages[idx].price && !errors.packages[idx].duration && !errors.packages[idx].included);
    return completePackages.length === 0;
  }, [errors, title, description, address, packages]);

  const onSave = async (e) => {
    e.preventDefault();
    validatePackages(true);
    if (hasErrors) return toast.error("Fix errors before saving");

    setSaving(true);
    try {
      const payload = packages.filter(p => p.price && p.duration && p.included.length > 0).map(p => ({
        name: p.tier, price: Number(p.price), duration: p.duration, services: p.included
      }));
      await api.put(`/services/${id}`, { title, description, address, packages: payload });
      toast.success("Service updated");
      navigate("/dashboard/service-provider/my-services");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update service");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><span className="loading loading-spinner text-primary"></span></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/dashboard/service-provider" className="btn btn-ghost"><ArrowLeftIcon /> Back</Link>
        <h1 className="text-2xl font-bold">Edit Service</h1>
      </div>

      <form onSubmit={onSave} className="space-y-6">
        {/* Title */}
        <div className="form-control">
          <label className="label">Title</label>
          <input type="text" value={title} className={`input input-bordered ${errors.title ? 'input-error' : ''}`} onChange={e => setTitle(e.target.value)} />
          {errors.title && <span className="text-red-500 text-sm">{errors.title}</span>}
        </div>
        {/* Description */}
        <div className="form-control">
          <label className="label">Description</label>
          <textarea value={description} className="textarea textarea-bordered" onChange={e => setDescription(e.target.value)} />
        </div>
        {/* Address */}
        <div className="form-control">
          <label className="label">Address</label>
          <input type="text" value={address} className="input input-bordered" onChange={e => setAddress(e.target.value)} />
        </div>

        {/* Packages */}
        <div className="divider">Packages</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg, idx) => (
            <div key={pkg.tier} className="rounded-xl bg-gray-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">{pkg.tier}</h3>

              <div className="form-control mb-3">
                <label>Price</label>
                <input type="text" value={pkg.price} className={`input input-bordered ${errors.packages[idx].price ? 'input-error' : ''}`} onChange={e => updatePackageField(idx, 'price', e.target.value)} />
                {errors.packages[idx].price && <span className="text-red-500 text-sm">{errors.packages[idx].price}</span>}
              </div>

              <div className="form-control mb-3">
                <label>Duration</label>
                <input type="text" value={pkg.duration} className={`input input-bordered ${errors.packages[idx].duration ? 'input-error' : ''}`} onChange={e => updatePackageField(idx, 'duration', e.target.value)} placeholder="30 minutes, 2 hours, 1 day"/>
                {errors.packages[idx].duration && <span className="text-red-500 text-sm">{errors.packages[idx].duration}</span>}
              </div>

              <div className="form-control">
                <label>Services Included</label>
                <input type="text" value={pkg.includeInput} className="input input-bordered" onChange={e => updatePackageField(idx, 'includeInput', e.target.value)} onKeyDown={e => { if(e.key==='Enter'){ e.preventDefault(); addIncludedService(idx); }}}/>
                <button type="button" className="btn btn-outline btn-sm mt-2" onClick={() => addIncludedService(idx)}><PlusIcon /> Add</button>
                {pkg.included.length>0 && <ul className="mt-2 space-y-1">{pkg.included.map((s,i)=><li key={i} className="flex justify-between items-center bg-white px-2 py-1 rounded">{s}<button type="button" className="btn btn-ghost btn-xs text-red-500" onClick={()=>removeIncludedService(idx,i)}><Trash2Icon /></button></li>)}</ul>}
                {errors.packages[idx].included && <span className="text-red-500 text-sm">{errors.packages[idx].included}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={hasErrors || saving} className={`btn btn-sm btn-outline bg-blue-600 text-white hover:bg-orange-500 ${hasErrors || saving ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditService;