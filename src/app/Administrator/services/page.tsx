'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface ServiceItem {
  id: string;
  name: string;
  imageUrl: string;
  price?: number;
}

interface Service {
  _id?: string;
  serviceId: string;
  name: string;
  items: ServiceItem[];
  isActive: boolean;
  includeInDecoration?: boolean;
  compulsory?: boolean;
  createdAt?: Date;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddServicePopup, setShowAddServicePopup] = useState(false);
  const [showAddItemPopup, setShowAddItemPopup] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; type?: 'service' | 'item'; serviceId?: string; service?: Service; itemId?: string }>({ show: false });
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  
  const [serviceName, setServiceName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (typeof window !== 'undefined' && (window as any).showToast) {
      (window as any).showToast({
        type: type,
        message: message,
        duration: 3000
      });
    }
  };

  const fetchServices = async () => {
    try {
      // Fetch all services including inactive ones for admin panel
      const response = await fetch('/api/admin/services?includeInactive=true');
      const data = await response.json();
      
      if (data.success) {
        console.log('📦 Admin fetched all services:', data.services);
        
        // Normalize services to ensure includeInDecoration and compulsory fields exist
        const normalizedServices = data.services.map((service: any) => ({
          ...service,
          includeInDecoration: service.includeInDecoration ?? false,
          compulsory: service.compulsory ?? false
        }));
        
        setServices(normalizedServices);
      }
    } catch (error) {
      
      showToast('Failed to fetch services', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImageFile(null);
    setImagePreview('');
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    // Resolve Cloudinary cloud name from database settings
    const getCloudinaryCloudName = async (): Promise<string> => {
      try {
        const cached = sessionStorage.getItem('cloudinaryCloudName');
        if (cached) return cached;
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        const name = data?.settings?.cloudinaryCloudName || '';
        if (name) sessionStorage.setItem('cloudinaryCloudName', name);
        return name;
      } catch (e) {
        return '';
      }
    };

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'FMTServices');
    formData.append('folder', 'feelmetown/services');

    const cloudName = await getCloudinaryCloudName();
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    return data.secure_url;
  };

  const handleAddService = () => {
    setEditingService(null);
    setServiceName('');
    setShowAddServicePopup(true);
  };

  const handleSaveService = async () => {
    if (!serviceName.trim()) {
      showToast('Please enter service name', 'error');
      return;
    }

    try {
      if (editingService) {
        // Update existing service
        const response = await fetch(`/api/admin/services?id=${editingService._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: serviceName.trim() })
        });

        const data = await response.json();

        if (data.success) {
          showToast('Service updated successfully!', 'success');
          setShowAddServicePopup(false);
          setServiceName('');
          setEditingService(null);
          fetchServices();
        } else {
          showToast(data.error || 'Failed to update service', 'error');
        }
      } else {
        // Add new service
        const serviceData = {
          name: serviceName.trim(),
          items: []
        };

        const response = await fetch('/api/admin/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceData)
        });

        const data = await response.json();

        if (data.success) {
          showToast('Service added successfully!', 'success');
          setShowAddServicePopup(false);
          setServiceName('');
          fetchServices();
        } else {
          showToast(data.error || 'Failed to add service', 'error');
        }
      }
    } catch (error) {
      
      showToast('Failed to save service', 'error');
    }
  };

  const handleAddItemClick = (service: Service) => {
    setSelectedService(service);
    setItemName('');
    setItemPrice('');
    setImagePreview('');
    setSelectedImageFile(null);
    setShowAddItemPopup(true);
  };

  const handleSaveItem = async () => {
    if (!itemName.trim()) {
      showToast('Please enter item name', 'error');
      return;
    }

    if (!selectedImageFile) {
      showToast('Please select an image', 'error');
      return;
    }

    try {
      setUploadingImage(true);
      const imageUrl = await uploadImageToCloudinary(selectedImageFile);

      const newItem: ServiceItem = {
        id: `ITEM${Date.now()}`,
        name: itemName.trim(),
        imageUrl: imageUrl,
        price: itemPrice ? parseFloat(itemPrice) : undefined
      };

      const updatedItems = [...(selectedService?.items || []), newItem];

      const response = await fetch(`/api/admin/services?id=${selectedService?._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems })
      });

      const data = await response.json();

      if (data.success) {
        showToast('Item added successfully!', 'success');
        setShowAddItemPopup(false);
        setItemName('');
        setItemPrice('');
        setImagePreview('');
        setSelectedImageFile(null);
        fetchServices();
      } else {
        showToast(data.error || 'Failed to add item', 'error');
      }
    } catch (error) {
      
      showToast('Failed to save item', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteServiceClick = (id: string) => {
    setDeleteConfirm({ show: true, type: 'service', serviceId: id });
  };

  const handleDeleteItemClick = (service: Service, itemId: string) => {
    setDeleteConfirm({ show: true, type: 'item', service: service, itemId: itemId });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm.type === 'service' && deleteConfirm.serviceId) {
      await deleteService(deleteConfirm.serviceId);
    } else if (deleteConfirm.type === 'item' && deleteConfirm.service && deleteConfirm.itemId) {
      await deleteItem(deleteConfirm.service, deleteConfirm.itemId);
    }
    setDeleteConfirm({ show: false });
  };

  const deleteService = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/services?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        showToast('Service deleted successfully!', 'success');
        fetchServices();
      } else {
        showToast(data.error || 'Failed to delete service', 'error');
      }
    } catch (error) {
      
      showToast('Failed to delete service', 'error');
    }
  };

  const deleteItem = async (service: Service, itemId: string) => {
    try {
      // Find the item to get its image URL
      const itemToDelete = service.items.find(item => item.id === itemId);
      
      // Delete from Cloudinary if image exists
      if (itemToDelete?.imageUrl) {
        try {
          await fetch('/api/admin/delete-cloudinary-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: itemToDelete.imageUrl })
          });
        } catch (error) {
          
        }
      }

      const updatedItems = service.items.filter(item => item.id !== itemId);

      const response = await fetch(`/api/admin/services?id=${service._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems })
      });

      const data = await response.json();

      if (data.success) {
        showToast('Item deleted successfully!', 'success');
        fetchServices();
      } else {
        showToast(data.error || 'Failed to delete item', 'error');
      }
    } catch (error) {
      
      showToast('Failed to delete item', 'error');
    }
  };

  const toggleExpand = (serviceId: string) => {
    setExpandedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const handleEditServiceClick = (service: Service) => {
    setEditingService(service);
    setServiceName(service.name);
    setShowAddServicePopup(true);
  };

  const handleToggleDecoration = async (service: Service) => {
    try {
      const newValue = !service.includeInDecoration;
      console.log(`🎨 Toggling includeInDecoration for ${service.name}:`, {
        currentValue: service.includeInDecoration,
        newValue: newValue,
        serviceId: service._id
      });
      
      // Optimistic UI update
      setServices(prevServices => 
        prevServices.map(s => 
          s._id === service._id 
            ? { ...s, includeInDecoration: newValue }
            : s
        )
      );
      
      const response = await fetch(`/api/admin/services?id=${service._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeInDecoration: newValue })
      });

      const data = await response.json();
      console.log('🎨 Toggle response:', data);

      if (data.success) {
        showToast(`Service ${newValue ? 'included in' : 'removed from'} decoration`, 'success');
        fetchServices(); // Refresh to ensure sync
      } else {
        // Revert on error
        setServices(prevServices => 
          prevServices.map(s => 
            s._id === service._id 
              ? { ...s, includeInDecoration: !newValue }
              : s
          )
        );
        showToast(data.error || 'Failed to update service', 'error');
      }
    } catch (error) {
      console.error('🎨 Toggle error:', error);
      // Revert on error
      setServices(prevServices => 
        prevServices.map(s => 
          s._id === service._id 
            ? { ...s, includeInDecoration: service.includeInDecoration }
            : s
        )
      );
      showToast('Failed to update service', 'error');
    }
};

  const handleToggleCompulsory = async (service: Service) => {
    try {
      // Handle undefined by treating it as false
      const currentValue = service.compulsory ?? false;
      const newValue = !currentValue;
      console.log(`🔒 Toggling compulsory for ${service.name}:`, {
        currentValue: currentValue,
        newValue: newValue,
        serviceId: service._id
      });
      
      // Optimistic UI update
      setServices(prevServices => 
        prevServices.map(s => 
          s._id === service._id 
            ? { ...s, compulsory: newValue }
            : s
        )
      );
      
      console.log('🔒 Sending request to:', `/api/admin/services?id=${service._id}`);
      console.log('🔒 Request body:', { compulsory: newValue });
      
      const response = await fetch(`/api/admin/services?id=${service._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compulsory: newValue })
      });

      console.log('🔒 Response status:', response.status);
      const data = await response.json();
      console.log('🔒 Toggle response:', data);

      if (data.success) {
        showToast(`Service ${newValue ? 'marked as' : 'removed from'} compulsory`, 'success');
        fetchServices(); // Refresh to ensure sync
      } else {
        // Revert on error
        setServices(prevServices => 
          prevServices.map(s => 
            s._id === service._id 
              ? { ...s, compulsory: !newValue }
              : s
          )
        );
        showToast(data.error || 'Failed to update service', 'error');
      }
    } catch (error) {
      console.error('🔒 Toggle error:', error);
      // Revert on error
      setServices(prevServices => 
        prevServices.map(s => 
          s._id === service._id 
            ? { ...s, compulsory: service.compulsory }
            : s
        )
      );
      showToast('Failed to update service', 'error');
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      const newValue = !service.isActive;
      console.log(`⚡ Toggling isActive for ${service.name}:`, {
        currentValue: service.isActive,
        newValue: newValue,
        serviceId: service._id
      });
      
      // Optimistic UI update
      setServices(prevServices => 
        prevServices.map(s => 
          s._id === service._id 
            ? { ...s, isActive: newValue }
            : s
        )
      );
      
      const response = await fetch(`/api/admin/services?id=${service._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newValue })
      });

      const data = await response.json();
      console.log('⚡ Toggle response:', data);

      if (data.success) {
        showToast(`Service ${newValue ? 'activated' : 'deactivated'}`, 'success');
        fetchServices(); // Refresh to ensure sync
      } else {
        // Revert on error
        setServices(prevServices => 
          prevServices.map(s => 
            s._id === service._id 
              ? { ...s, isActive: !newValue }
              : s
          )
        );
        showToast(data.error || 'Failed to update service', 'error');
      }
    } catch (error) {
      console.error('⚡ Toggle error:', error);
      // Revert on error
      setServices(prevServices => 
        prevServices.map(s => 
          s._id === service._id 
            ? { ...s, isActive: service.isActive }
            : s
        )
      );
      showToast('Failed to update service', 'error');
    }
  };

  if (loading) {
    return (
      <div className="services-page">
        <div className="loading">Loading services...</div>
      </div>
    );
  }

  // Filter services based on status
  const filteredServices = services.filter(service => {
    if (filterStatus === 'active') return service.isActive;
    if (filterStatus === 'inactive') return !service.isActive;
    return true; // 'all'
  });

  return (
    <div className="services-page">
      <div className="page-header">
        <h1>Extra Services Management</h1>
        <div className="header-actions">
          <div className="total-count">
            <span className="count-number">{filteredServices.length}</span>
            <span className="count-label">
              {filterStatus === 'all' ? 'Total' : filterStatus === 'active' ? 'Active' : 'Inactive'} Services
            </span>
          </div>
          <button className="add-btn" onClick={handleAddService}>
            <Plus size={20} />
            Add Service
          </button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="filter-buttons">
        <button 
          className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          All Services ({services.length})
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
          onClick={() => setFilterStatus('active')}
        >
          Active ({services.filter(s => s.isActive).length})
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'inactive' ? 'active' : ''}`}
          onClick={() => setFilterStatus('inactive')}
        >
          Inactive ({services.filter(s => !s.isActive).length})
        </button>
      </div>

      <div className="services-list">
        {filteredServices.map((service) => (
          <div key={service._id} className={`service-card ${!service.isActive ? 'inactive' : ''}`}>
            <div className="service-header">
              <div className="service-title">
                <h3>
                  {service.name}
                  {!service.isActive && <span className="inactive-badge">Inactive</span>}
                </h3>
                <span className="items-count">{service.items.length} items</span>
              </div>
              <div className="service-actions">
                <label className="toggle-container">
                  <input
                    type="checkbox"
                    checked={service.isActive}
                    onChange={() => handleToggleActive(service)}
                  />
                  <span className="toggle-label">{service.isActive ? 'Active' : 'Inactive'}</span>
                </label>
                <label className="toggle-container">
                  <input
                    type="checkbox"
                    checked={service.includeInDecoration || false}
                    onChange={() => handleToggleDecoration(service)}
                  />
                  <span className="toggle-label">Include in Decoration</span>
                </label>
                <label className="toggle-container">
                  <input
                    type="checkbox"
                    checked={service.compulsory || false}
                    onChange={() => handleToggleCompulsory(service)}
                  />
                  <span className="toggle-label">Compulsory</span>
                </label>
                <button 
                  className="expand-btn" 
                  onClick={() => toggleExpand(service._id!)}
                >
                  {expandedServices.has(service._id!) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                <button className="edit-btn" onClick={() => handleEditServiceClick(service)}>
                  <Edit size={18} />
                </button>
                <button className="add-item-btn" onClick={() => handleAddItemClick(service)}>
                  <Plus size={18} />
                  Add Item
                </button>
                <button className="delete-btn" onClick={() => handleDeleteServiceClick(service._id!)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {expandedServices.has(service._id!) && (
              <div className="items-grid">
                {service.items.map((item) => (
                  <div key={item.id} className="item-card">
                    <div className="item-image">
                      <img src={item.imageUrl} alt={item.name} />
                    </div>
                    <div className="item-info">
                      <h4>{item.name}</h4>
                      {item.price && <p className="item-price">₹{item.price}</p>}
                    </div>
                    <button 
                      className="item-delete-btn" 
                      onClick={() => handleDeleteItemClick(service, item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Service Popup */}
      {showAddServicePopup && (
        <div className="popup-overlay" onClick={() => setShowAddServicePopup(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h2>{editingService ? 'Edit Service' : 'Add New Service'}</h2>
              <button className="close-btn" onClick={() => { setShowAddServicePopup(false); setEditingService(null); setServiceName(''); }}>×</button>
            </div>
            
            <div className="popup-body">
              <div className="form-group">
                <label>Service Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g., Food & Beverage, Decorations"
                />
              </div>

              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setShowAddServicePopup(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSaveService}>
                  Add Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Popup */}
      {showAddItemPopup && (
        <div className="popup-overlay" onClick={() => setShowAddItemPopup(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h2>Add Item to {selectedService?.name}</h2>
              <button className="close-btn" onClick={() => setShowAddItemPopup(false)}>×</button>
            </div>
            
            <div className="popup-body">
              <div className="form-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g., Pizza, Burger"
                />
              </div>

              <div className="form-group">
                <label>Price (Optional)</label>
                <input
                  type="number"
                  className="form-input"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="e.g., 299"
                />
              </div>

              <div className="form-group">
                <label>Item Image *</label>
                {!imagePreview ? (
                  <div className="image-upload-placeholder">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      style={{ display: 'none' }}
                      id="item-image-upload"
                    />
                    <label htmlFor="item-image-upload" className="upload-label">
                      <div className="upload-icon">📷</div>
                      <div className="upload-text">Click to upload image</div>
                      <div className="upload-hint">Drag and drop or browse</div>
                      <div className="upload-format">PNG, JPG, WEBP (max 5MB)</div>
                    </label>
                  </div>
                ) : (
                  <div className="image-preview-container">
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                    <button className="remove-image-btn" onClick={removeImage}>✕</button>
                    <div className="preview-label">Image Preview</div>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setShowAddItemPopup(false)}>
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleSaveItem}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? 'Uploading...' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {deleteConfirm.show && (
        <div className="popup-overlay" onClick={() => setDeleteConfirm({ show: false })}>
          <div className="popup-content delete-confirm-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h2>Confirm Delete</h2>
              <button className="close-btn" onClick={() => setDeleteConfirm({ show: false })}>×</button>
            </div>
            <div className="popup-body">
              <p>
                {deleteConfirm.type === 'service' 
                  ? 'Are you sure you want to delete this service? All items in this service will also be deleted.' 
                  : 'Are you sure you want to delete this item? This action cannot be undone.'}
              </p>
            </div>
            <div className="popup-footer">
              <button className="btn-secondary" onClick={() => setDeleteConfirm({ show: false })}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleConfirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .services-page {
          padding: 2rem;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .page-header h1 {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 2rem;
          color: #333;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .total-count {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .count-number {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 2rem;
          color: white;
          font-weight: 700;
          line-height: 1;
        }

        .count-label {
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.95);
          white-space: nowrap;
        }

        .add-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: var(--accent-color);
          color: white;
          border: none;
          border-radius: 8px;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .add-btn:hover {
          background: #c41e3a;
        }

        .filter-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 0.5rem;
          background: #f9fafb;
          border-radius: 12px;
          width: fit-content;
        }

        .filter-btn {
          padding: 0.75rem 1.5rem;
          border: 2px solid transparent;
          border-radius: 8px;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
          color: #64748b;
        }

        .filter-btn:hover {
          border-color: #e2e8f0;
          color: #475569;
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .services-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .service-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: opacity 0.3s ease;
        }

        .service-card.inactive {
          opacity: 0.6;
          background: #f9fafb;
        }

        .service-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .service-title h3 {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 1.5rem;
          color: #333;
          margin-bottom: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .inactive-badge {
          font-size: 0.75rem;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          padding: 0.25rem 0.75rem;
          background: #ef4444;
          color: white;
          border-radius: 12px;
          font-weight: 600;
        }

        .items-count {
          font-size: 0.9rem;
          color: #666;
        }

        .service-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .toggle-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #f9fafb;
          border-radius: 6px;
          cursor: pointer;
          user-select: none;
        }

        .toggle-container input[type="checkbox"] {
          position: relative;
          width: 44px;
          height: 24px;
          appearance: none;
          background: #cbd5e1;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .toggle-container input[type="checkbox"]:checked {
          background: #10b981;
        }

        .toggle-container input[type="checkbox"]::before {
          content: '';
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          top: 3px;
          left: 3px;
          transition: transform 0.3s ease;
        }

        .toggle-container input[type="checkbox"]:checked::before {
          transform: translateX(20px);
        }

        .toggle-label {
          font-size: 0.85rem;
          color: #475569;
          white-space: nowrap;
        }

        .expand-btn, .edit-btn, .add-item-btn, .delete-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .expand-btn {
          background: #f3f4f6;
          color: #333;
        }

        .expand-btn:hover {
          background: #e5e7eb;
        }

        .edit-btn {
          background: #fef3c7;
          color: #d97706;
        }

        .edit-btn:hover {
          background: #d97706;
          color: white;
        }

        .add-item-btn {
          background: #f0f9ff;
          color: #0369a1;
        }

        .add-item-btn:hover {
          background: #0369a1;
          color: white;
        }

        .delete-btn {
          background: #fef2f2;
          color: #dc2626;
        }

        .delete-btn:hover {
          background: #dc2626;
          color: white;
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .item-card {
          background: #f9fafb;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .item-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .item-image {
          width: 100%;
          height: 150px;
          overflow: hidden;
          padding: 0.75rem;
          background: white;
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 6px;
        }

        .item-info {
          padding: 1rem;
        }

        .item-info h4 {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 1rem;
          color: #333;
          margin-bottom: 0.25rem;
        }

        .item-price {
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.9rem;
          color: var(--accent-color);
          font-weight: 600;
        }

        .item-delete-btn {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: rgba(220, 38, 38, 0.9);
          color: white;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .item-card:hover .item-delete-btn {
          opacity: 1;
        }

        .loading {
          text-align: center;
          padding: 3rem;
          color: #666;
          font-size: 1.1rem;
        }

        /* Popup Styles */
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .popup-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .popup-header h2 {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 1.5rem;
          color: #333;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 2rem;
          color: #999;
          cursor: pointer;
          line-height: 1;
          padding: 0;
        }

        .close-btn:hover {
          color: #333;
        }

        .popup-body {
          padding: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          color: #000 !important;
          margin-bottom: 0.5rem;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.9rem;
          color: #000;
          background: white;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--accent-color);
        }

        /* Image Upload Styles */
        .image-upload-placeholder {
          border: 2px dashed #ddd;
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .image-upload-placeholder:hover {
          border-color: var(--accent-color);
          background: #fafafa;
        }

        .upload-label {
          cursor: pointer;
          display: block;
        }

        .upload-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }

        .upload-text {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 1rem;
          color: #333;
          margin-bottom: 0.25rem;
        }

        .upload-hint {
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 0.5rem;
        }

        .upload-format {
          font-size: 0.75rem;
          color: #999;
        }

        .image-preview-container {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
        }

        .image-preview {
          width: 100%;
          max-height: 300px;
          object-fit: cover;
          border-radius: 8px;
        }

        .remove-image-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          cursor: pointer;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-image-btn:hover {
          background: rgba(220, 38, 38, 0.9);
        }

        .preview-label {
          text-align: center;
          padding: 0.5rem;
          background: #f3f4f6;
          font-size: 0.85rem;
          color: #666;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
        }

        .btn-secondary, .btn-primary {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #333;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        .btn-primary {
          background: var(--accent-color);
          color: white;
        }

        .btn-primary:hover {
          background: #c41e3a;
        }

        .btn-primary:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .btn-danger {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #dc2626;
          color: white;
        }

        .btn-danger:hover {
          background: #b91c1c;
        }

        .delete-confirm-popup {
          max-width: 450px;
        }

        .delete-confirm-popup .popup-body {
          color: #333;
        }

        .delete-confirm-popup .popup-body p {
          color: #333 !important;
          margin: 0;
          line-height: 1.6;
        }

        .popup-footer {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

      `}</style>
    </div>
  );
}

