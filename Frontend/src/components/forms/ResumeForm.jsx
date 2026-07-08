import React from 'react';
import { useForm } from 'react-hook-form';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { User, Save } from 'lucide-react';

const ResumeForm = ({ initialData, onUpdate, loading }) => {
  // Helper function to format name to first and last only
  const formatName = (fullName) => {
    if (!fullName) return '';
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
    }
    return fullName;
  };

  // Helper function to format location to city and country only
  const formatLocation = (location) => {
    if (!location) return '';
    
    let loc = location.trim();
    
    // Remove postcodes aggressively (UK, US, and international formats)
    loc = loc.replace(/\b[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}\b/g, ''); // UK postcodes like "SS14 1RE"
    loc = loc.replace(/\b\d{5}(-\d{4})?\b/g, ''); // US zip codes
    loc = loc.replace(/\b[A-Z]{3}\s?\d{3}\s?[A-Z]{3}\b/g, ''); // Canadian postcodes
    loc = loc.replace(/\b\d{4}\s?[A-Z]{3}\b/g, ''); // Australian postcodes
    
    // Remove street numbers and apartment numbers
    loc = loc.replace(/\b\d+\s*(?:st|nd|rd|th)?\s*(?:street|road|avenue|lane|drive|blvd|court|place|crescent|close|gardens|park|way|street|road|avenue|lane|drive|boulevard)\b/gi, '');
    loc = loc.replace(/\b(?:apt|suite|unit|flat|floor|building|room)\s*[\w\d]+/gi, '');
    loc = loc.replace(/\b\d+\b/g, ''); // Remove any remaining standalone numbers
    
    // Remove common address indicators
    loc = loc.replace(/\b(?:street|road|avenue|lane|drive|boulevard|court|place|crescent|close|gardens|park|way|st|rd|ave|ln|dr|blvd|ct|pl)\b/gi, '');
    
    // Clean up extra spaces and commas
    loc = loc.replace(/\s*,\s*$/, ''); // Remove trailing commas
    loc = loc.replace(/\s+/g, ' ').trim(); // Normalize spaces
    
    // Split by comma and take last meaningful parts
    const parts = loc.split(',').map(p => p.trim()).filter(p => p.length > 0);
    
    if (parts.length >= 2) {
      // Take last two parts that aren't empty or just numbers
      const meaningfulParts = parts.filter(part => !/^\d+$/.test(part) && part.length > 1);
      if (meaningfulParts.length >= 2) {
        return meaningfulParts.slice(-2).join(', ');
      } else if (meaningfulParts.length === 1) {
        return meaningfulParts[0];
      }
    }
    
    // If no comma or single meaningful part, extract from remaining text
    const words = loc.split(' ').filter(word => 
      word.length > 1 && 
      !/^\d+$/.test(word) && 
      !/^(st|rd|th|nd)$/i.test(word) &&
      !/^(street|road|avenue|lane|drive|boulevard|court|place|crescent|close|gardens|park|way)$/i.test(word)
    );
    
    if (words.length > 0) {
      // Take last 2 meaningful words (usually city, county/country)
      return words.slice(-2).join(' ');
    }
    
    return '';
  };

  // Process initial data to format name and location
  const processedInitialData = {
    ...initialData,
    personal_info: {
      ...initialData?.personal_info,
      name: formatName(initialData?.personal_info?.name || ''),
      location: formatLocation(initialData?.personal_info?.location || '')
    }
  };

  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: processedInitialData
  });


  const onSubmit = (data) => {
    onUpdate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Personal Information */}
      <section className="bg-white rounded-[24px] shadow-sm p-8 border border-[#ECE9F7] hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center mb-8">
          <div className="w-10 h-10 bg-[#F3E8FF] text-[#7C3AED] rounded-xl flex items-center justify-center mr-4">
            <User size={20} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-bold text-[#0F0F1A] tracking-tight">Personal Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Full Name" {...register('personal_info.name')} />
          <Input label="Location" {...register('personal_info.location')} />
          <Input label="Sector/Domain" {...register('personal_info.sector')} />
          <Input label="RL ID" {...register('personal_info.rl_id')} />
        </div>
      </section>

      <div className="flex justify-center pt-8 pb-12">
        <Button type="submit" className="select-btn h-[54px] shadow-xl shadow-[rgba(124,58,237,0.25)] text-[16px] px-12" loading={loading}>
          <Save size={20} className="mr-2" strokeWidth={2.5} /> Save Changes & Preview
        </Button>
      </div>
    </form>
  );
};

export default ResumeForm;
